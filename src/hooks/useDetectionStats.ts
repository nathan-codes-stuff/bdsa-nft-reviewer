import { useMemo } from 'react'
import type { DsaAnnotationElement } from '../api/dsa'

export interface RoiStats {
  /** Index of the ROI element in the source array. */
  index: number
  /** Optional human label for the ROI. */
  label: string
  /** Width × height in image pixels, if computable. */
  area: number | null
  /** Number of detection labels whose center falls inside this ROI. */
  detectionCount: number
  /** Mean confidence across detections inside this ROI (null if none). */
  meanConfidence: number | null
  /** Histogram of confidence values, 10 bins from 0.0 to 1.0. */
  histogram: number[]
}

export interface DetectionStats {
  rois: RoiStats[]
  /** Detections that did not fall inside any ROI. */
  orphanCount: number
  totalDetections: number
  overallMeanConfidence: number | null
  overallHistogram: number[]
}

const ROI_GROUPS = new Set(['roi', 'ROI', 'rois'])
const DETECTION_GROUPS = new Set(['nft', 'NFT', 'detection', 'detections', 'label', 'labels'])

function elementCenter(el: DsaAnnotationElement): [number, number] | null {
  if (Array.isArray(el.center) && el.center.length >= 2) {
    return [Number(el.center[0]), Number(el.center[1])]
  }
  if (Array.isArray(el.points) && el.points.length > 0) {
    const xs = el.points.map(p => Number(p[0]))
    const ys = el.points.map(p => Number(p[1]))
    return [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2]
  }
  return null
}

function isRoi(el: DsaAnnotationElement): boolean {
  if (el.group && ROI_GROUPS.has(String(el.group))) return true
  if (el.type === 'rectangle' && (!el.group || el.group === 'roi')) {
    const w = Number(el.width || 0)
    const h = Number(el.height || 0)
    if (w > 500 && h > 500) return true
  }
  return false
}

function isDetection(el: DsaAnnotationElement): boolean {
  if (el.group && DETECTION_GROUPS.has(String(el.group))) return true
  if (el.type === 'rectangle' && typeof el.user?.confidence === 'number') return true
  return false
}

function confidenceOf(el: DsaAnnotationElement): number | null {
  const c = (el.user as { confidence?: unknown } | undefined)?.confidence
  return typeof c === 'number' ? c : null
}

function pointInRect(
  point: [number, number],
  rectCenter: [number, number],
  width: number,
  height: number,
): boolean {
  const [px, py] = point
  const [cx, cy] = rectCenter
  return Math.abs(px - cx) <= width / 2 && Math.abs(py - cy) <= height / 2
}

export function useDetectionStats(
  elements: DsaAnnotationElement[] | null,
): DetectionStats {
  return useMemo<DetectionStats>(() => {
    const empty: DetectionStats = {
      rois: [],
      orphanCount: 0,
      totalDetections: 0,
      overallMeanConfidence: null,
      overallHistogram: new Array(10).fill(0),
    }
    if (!elements || elements.length === 0) return empty

    const rois = elements
      .map((el, index) => ({ el, index }))
      .filter(({ el }) => isRoi(el))

    const detections = elements.filter(isDetection)

    const overallHistogram = new Array(10).fill(0)
    let confSum = 0
    let confCount = 0
    for (const det of detections) {
      const c = confidenceOf(det)
      if (c == null) continue
      confSum += c
      confCount += 1
      const bin = Math.min(9, Math.max(0, Math.floor(c * 10)))
      overallHistogram[bin] += 1
    }

    const roiStats: RoiStats[] = rois.map(({ el, index }) => {
      const center = elementCenter(el)
      const width = Number(el.width || 0)
      const height = Number(el.height || 0)
      const area = width > 0 && height > 0 ? width * height : null
      const label = el.label?.value || `ROI ${index + 1}`

      const histogram = new Array(10).fill(0)
      let sum = 0
      let count = 0

      if (center && width > 0 && height > 0) {
        for (const det of detections) {
          const dc = elementCenter(det)
          if (!dc) continue
          if (!pointInRect(dc, center, width, height)) continue
          const c = confidenceOf(det)
          if (c == null) continue
          sum += c
          count += 1
          const bin = Math.min(9, Math.max(0, Math.floor(c * 10)))
          histogram[bin] += 1
        }
      }

      return {
        index,
        label,
        area,
        detectionCount: count,
        meanConfidence: count > 0 ? sum / count : null,
        histogram,
      }
    })

    const insideTotal = roiStats.reduce((s, r) => s + r.detectionCount, 0)

    return {
      rois: roiStats,
      orphanCount: Math.max(0, detections.length - insideTotal),
      totalDetections: detections.length,
      overallMeanConfidence: confCount > 0 ? confSum / confCount : null,
      overallHistogram,
    }
  }, [elements])
}
