import { useCallback, useEffect, useMemo, useState } from 'react'
import { SlideViewer, dsaAuthStore } from 'bdsa-react-components'

interface AnnotationFeature {
  id?: string | number
  left: number
  top: number
  width: number
  height: number
  color?: string
  group?: string | number
  label?: string
  [key: string]: unknown
}

import {
  dsa,
  type DsaAnnotationElement,
  type DsaAnnotationDoc,
} from '../api/dsa'
import { useSlideData } from '../hooks/useSlideData'
import { useDetectionStats } from '../hooks/useDetectionStats'
import { useHotkeys } from '../hooks/useHotkeys'
import { useMode } from '../context/ModeContext'
import { LeftRail } from './LeftRail'
import { ReviewerPanel } from './ReviewerPanel'
import { ResearcherPanel } from './ResearcherPanel'
import type { SaveState } from './SavePill'

interface WorkspaceProps {
  itemId: string
}

type Verdict = 'accepted' | 'rejected'

const REVIEW_USER_KEY = 'bdsa_nft_reviewer_verdict'

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

function confidenceOf(el: DsaAnnotationElement): number | null {
  const c = (el.user as { confidence?: unknown } | undefined)?.confidence
  return typeof c === 'number' ? c : null
}

function isDetection(el: DsaAnnotationElement): boolean {
  if (el.group && /^(nft|detection|labels?)$/i.test(String(el.group))) return true
  if (el.type === 'rectangle' && typeof el.user?.confidence === 'number') return true
  return false
}

function isRoi(el: DsaAnnotationElement): boolean {
  if (el.group && /^rois?$/i.test(String(el.group))) return true
  return false
}

function elementId(el: DsaAnnotationElement, idx: number): string {
  return el.id || `idx_${idx}`
}

const DEFAULT_DET_COLOR = '#4f9eff'
const ACCEPTED_COLOR = '#36c26b'
const REJECTED_COLOR = '#e25c5c'
const ROI_COLOR = '#f1c64a'

export function Workspace({ itemId }: WorkspaceProps) {
  const { mode } = useMode()
  const { state, selectAnnotation, setActiveDoc, setError } = useSlideData(itemId)
  const [confidenceThreshold, setConfidenceThreshold] = useState(0)
  const [hideLowConfidence, setHideLowConfidence] = useState(true)
  const [activeRoiIndex, setActiveRoiIndex] = useState<number | null>(null)
  const [verdicts, setVerdicts] = useState<Record<string, Verdict>>({})
  const [reviewIndex, setReviewIndex] = useState(0)
  const [saveState, setSaveState] = useState<SaveState>('clean')
  const [saveError, setSaveError] = useState<string | null>(null)

  // Auto-select the first annotation that looks like a YOLO doc.
  useEffect(() => {
    if (!state.activeId && state.annotations.length > 0) {
      const yoloLike = state.annotations.find(
        a => /yolo|nft|detection|braak|tangle/i.test(a.annotation.name),
      ) || state.annotations[0]
      selectAnnotation(yoloLike._id)
    }
  }, [state.annotations, state.activeId, selectAnnotation])

  // Reset local review state when a new doc loads.
  useEffect(() => {
    if (!state.activeDoc) return
    const initialVerdicts: Record<string, Verdict> = {}
    state.activeDoc.annotation.elements.forEach((el, idx) => {
      const existing = (el.user as { [REVIEW_USER_KEY]?: Verdict } | undefined)?.[REVIEW_USER_KEY]
      if (existing === 'accepted' || existing === 'rejected') {
        initialVerdicts[elementId(el, idx)] = existing
      }
    })
    setVerdicts(initialVerdicts)
    setReviewIndex(0)
    setSaveState('clean')
    setSaveError(null)
  }, [state.activeDoc])

  const elements = state.activeDoc?.annotation.elements || []
  const detections = useMemo(() => elements.filter(isDetection), [elements])
  const stats = useDetectionStats(elements)

  // Build AnnotationFeature[] for SlideViewer.
  const overlayFeatures = useMemo<AnnotationFeature[]>(() => {
    const features: AnnotationFeature[] = []

    // ROIs always shown (yellow).
    elements.forEach((el, idx) => {
      if (!isRoi(el)) return
      const center = elementCenter(el)
      if (!center) return
      const w = Number(el.width || 0)
      const h = Number(el.height || 0)
      if (w <= 0 || h <= 0) return
      features.push({
        id: elementId(el, idx),
        left: center[0] - w / 2,
        top: center[1] - h / 2,
        width: w,
        height: h,
        color: ROI_COLOR,
        label: el.label?.value || `ROI ${idx + 1}`,
        group: 'roi',
      })
    })

    // Detections, filtered by confidence threshold.
    detections.forEach((el, i) => {
      const idx = elements.indexOf(el)
      const center = elementCenter(el)
      if (!center) return
      const conf = confidenceOf(el)
      if (hideLowConfidence && conf != null && conf < confidenceThreshold) return
      const w = Number(el.width || 0)
      const h = Number(el.height || 0)
      if (w <= 0 || h <= 0) return
      const id = elementId(el, idx)
      const verdict = verdicts[id]
      const color =
        verdict === 'accepted' ? ACCEPTED_COLOR
        : verdict === 'rejected' ? REJECTED_COLOR
        : DEFAULT_DET_COLOR
      features.push({
        id,
        left: center[0] - w / 2,
        top: center[1] - h / 2,
        width: w,
        height: h,
        color,
        label: conf != null ? conf.toFixed(2) : '',
        group: verdict || 'detection',
        confidence: conf,
        verdict: verdict || null,
        detectionIndex: i,
      } as AnnotationFeature)
    })

    return features
  }, [elements, detections, hideLowConfidence, confidenceThreshold, verdicts])

  // Build the visible detections list (used for the review cursor).
  const visibleDetections = useMemo(() => {
    if (!hideLowConfidence) return detections
    return detections.filter(el => {
      const c = confidenceOf(el)
      return c == null || c >= confidenceThreshold
    })
  }, [detections, hideLowConfidence, confidenceThreshold])

  function setVerdict(id: string, verdict: Verdict) {
    setVerdicts(prev => {
      const next = { ...prev }
      if (next[id] === verdict) {
        delete next[id]
      } else {
        next[id] = verdict
      }
      return next
    })
    setSaveState('dirty')
  }

  const cursorElement = visibleDetections[reviewIndex]
  const cursorId = cursorElement
    ? elementId(cursorElement, elements.indexOf(cursorElement))
    : null

  const advance = useCallback((delta: number) => {
    if (visibleDetections.length === 0) return
    setReviewIndex(i => {
      const next = (i + delta + visibleDetections.length) % visibleDetections.length
      return next
    })
  }, [visibleDetections.length])

  async function handleSave() {
    if (!state.activeDoc) return
    if (saveState === 'saving') return
    setSaveState('saving')
    setSaveError(null)
    try {
      const updated = state.activeDoc.annotation.elements.map((el, idx) => {
        const id = elementId(el, idx)
        const verdict = verdicts[id]
        if (!verdict) {
          if (el.user && REVIEW_USER_KEY in el.user) {
            const { [REVIEW_USER_KEY]: _drop, ...rest } = el.user as Record<string, unknown>
            return { ...el, user: rest }
          }
          return el
        }
        return {
          ...el,
          user: {
            ...(el.user || {}),
            [REVIEW_USER_KEY]: verdict,
            [`${REVIEW_USER_KEY}_at`]: new Date().toISOString(),
            [`${REVIEW_USER_KEY}_by`]: dsaAuthStore.getStatus().user?.login || 'unknown',
          },
        }
      })
      const saved: DsaAnnotationDoc = await dsa.updateAnnotation(state.activeDoc._id, {
        name: state.activeDoc.annotation.name,
        description: state.activeDoc.annotation.description,
        elements: updated as DsaAnnotationElement[],
      })
      setActiveDoc(saved)
      setSaveState('saved')
    } catch (err) {
      setSaveError(String((err as Error).message || err))
      setSaveState('error')
    }
  }

  // Hotkeys
  useHotkeys({
    arrowright: () => advance(1),
    arrowleft: () => advance(-1),
    a: () => cursorId && setVerdict(cursorId, 'accepted'),
    r: () => cursorId && setVerdict(cursorId, 'rejected'),
    ' ': () => setHideLowConfidence(v => !v),
    s: () => handleSave(),
  })

  const modelLabel = state.activeDoc?.annotation.name || '—'
  const baseUrl = dsaAuthStore.getStatus().serverUrl || ''
  const authToken = dsaAuthStore.getToken()

  const dziUrl = useMemo(() => {
    if (!baseUrl || !itemId) return undefined
    return `${baseUrl}/api/v1/item/${encodeURIComponent(itemId)}/tiles/dzi.dzi`
  }, [baseUrl, itemId])

  return (
    <div className="workspace">
      <LeftRail
        stats={stats}
        activeRoiIndex={activeRoiIndex}
        onSelectRoi={setActiveRoiIndex}
        annotationDocName={state.activeDoc?.annotation.name}
        annotationDocId={state.activeId}
        fetchedAt={state.fetchedAt}
      />
      <div className="viewer-wrap">
        {state.error && (
          <div className="error-banner" style={{ position: 'absolute', top: 12, left: 12, right: 12, zIndex: 10 }}>
            {state.error}
            <button
              className="btn"
              style={{ marginLeft: 12 }}
              onClick={() => setError(null)}
            >Dismiss</button>
          </div>
        )}
        {saveError && (
          <div className="error-banner" style={{ position: 'absolute', top: 12, left: 12, right: 12, zIndex: 10 }}>
            Save failed: {saveError}
          </div>
        )}
        {dziUrl ? (
          <SlideViewer
            imageInfo={{ dziUrl }}
            annotations={overlayFeatures}
            authToken={authToken}
            tokenQueryParam={true}
            height="100%"
            width="100%"
            showInfoBar={true}
            strokeWidth={2}
          />
        ) : (
          <div className="empty-state">Loading slide…</div>
        )}
      </div>
      {mode === 'pathologist' ? (
        <ReviewerPanel
          saveState={saveState}
          onSave={handleSave}
          confidenceThreshold={confidenceThreshold}
          onConfidenceChange={setConfidenceThreshold}
          reviewIndex={reviewIndex}
          reviewTotal={visibleDetections.length}
          modelLabel={modelLabel}
        />
      ) : (
        <ResearcherPanel
          saveState={saveState}
          annotations={state.annotations}
          activeId={state.activeId}
          onSelectAnnotation={selectAnnotation}
          stats={stats}
          elements={elements}
          slideName={state.item?.name || itemId}
          itemId={itemId}
        />
      )}
    </div>
  )
}
