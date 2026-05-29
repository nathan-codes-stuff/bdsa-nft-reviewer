import type { DetectionStats } from '../hooks/useDetectionStats'

interface LeftRailProps {
  stats: DetectionStats
  activeRoiIndex: number | null
  onSelectRoi: (index: number) => void
  annotationDocName?: string
  annotationDocId?: string | null
  fetchedAt: number | null
}

function fmt(n: number | null, digits = 3): string {
  if (n == null || Number.isNaN(n)) return '—'
  return n.toFixed(digits)
}

export function LeftRail({
  stats,
  activeRoiIndex,
  onSelectRoi,
  annotationDocName,
  annotationDocId,
  fetchedAt,
}: LeftRailProps) {
  return (
    <aside className="rail left" aria-label="ROI list">
      <div className="section">
        <h2>Annotation document</h2>
        <div className="label-line">
          <span>Name</span>
          <span className="num">{annotationDocName || '—'}</span>
        </div>
        <div className="label-line">
          <span>Doc ID</span>
          <span className="num">{annotationDocId || '—'}</span>
        </div>
        <div className="label-line">
          <span>Fetched</span>
          <span className="num">{fetchedAt ? new Date(fetchedAt).toLocaleTimeString() : '—'}</span>
        </div>
        <div className="label-line">
          <span>Detections</span>
          <span className="num">{stats.totalDetections}</span>
        </div>
        <div className="label-line">
          <span>Mean confidence</span>
          <span className="num">{fmt(stats.overallMeanConfidence)}</span>
        </div>
        <Histogram bins={stats.overallHistogram} />
      </div>

      <h2>ROIs ({stats.rois.length})</h2>
      {stats.rois.length === 0 && (
        <p className="muted" style={{ fontSize: 12 }}>
          No ROIs detected in this annotation document. Detections still render globally.
        </p>
      )}
      {stats.rois.map(roi => (
        <button
          key={roi.index}
          type="button"
          className={`roi-item ${activeRoiIndex === roi.index ? 'active' : ''}`}
          onClick={() => onSelectRoi(roi.index)}
        >
          <div className="name">
            <span>{roi.label}</span>
            <span className="count">{roi.detectionCount}</span>
          </div>
          <div className="meta">
            mean conf {fmt(roi.meanConfidence)} · area {roi.area ? roi.area.toLocaleString() + ' px²' : '—'}
          </div>
          <Histogram bins={roi.histogram} />
        </button>
      ))}
      {stats.orphanCount > 0 && (
        <p className="muted" style={{ fontSize: 12, marginTop: 10 }}>
          {stats.orphanCount} detections not contained in any ROI.
        </p>
      )}
    </aside>
  )
}

function Histogram({ bins }: { bins: number[] }) {
  const max = Math.max(1, ...bins)
  return (
    <div className="histogram" aria-label="confidence histogram">
      {bins.map((v, i) => (
        <div
          key={i}
          className="bar"
          style={{ height: `${(v / max) * 100}%` }}
          title={`${(i / 10).toFixed(1)}–${((i + 1) / 10).toFixed(1)}: ${v}`}
        />
      ))}
    </div>
  )
}
