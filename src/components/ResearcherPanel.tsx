import { SavePill, type SaveState } from './SavePill'
import type { DsaAnnotationHeader, DsaAnnotationElement } from '../api/dsa'
import type { DetectionStats } from '../hooks/useDetectionStats'

interface ResearcherPanelProps {
  saveState: SaveState
  annotations: DsaAnnotationHeader[]
  activeId: string | null
  onSelectAnnotation: (id: string) => void
  stats: DetectionStats
  elements: DsaAnnotationElement[]
  slideName: string
  itemId: string
}

function csvEscape(s: unknown): string {
  const str = String(s ?? '')
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map(r => r.map(csvEscape).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function exportElements(slideName: string, itemId: string, elements: DsaAnnotationElement[]) {
  const rows: string[][] = [['element_id', 'type', 'group', 'center_x', 'center_y', 'width', 'height', 'confidence', 'label']]
  for (const el of elements) {
    const center = el.center || [null, null]
    rows.push([
      el.id || '',
      el.type,
      String(el.group ?? ''),
      String(center[0] ?? ''),
      String(center[1] ?? ''),
      String(el.width ?? ''),
      String(el.height ?? ''),
      String((el.user as { confidence?: number } | undefined)?.confidence ?? ''),
      el.label?.value ?? '',
    ])
  }
  const safeName = slideName.replace(/[^a-z0-9._-]/gi, '_')
  downloadCsv(`${safeName}__${itemId}__detections.csv`, rows)
}

export function ResearcherPanel({
  saveState,
  annotations,
  activeId,
  onSelectAnnotation,
  stats,
  elements,
  slideName,
  itemId,
}: ResearcherPanelProps) {
  return (
    <aside className="rail" aria-label="Researcher tools">
      <div className="section">
        <h2>Save</h2>
        <SavePill state={saveState} />
      </div>

      <div className="section">
        <h2>Annotation documents on item</h2>
        {annotations.length === 0 && (
          <p className="muted" style={{ fontSize: 12 }}>No annotation documents on this item.</p>
        )}
        <select
          className="btn full"
          value={activeId || ''}
          onChange={e => onSelectAnnotation(e.target.value)}
        >
          <option value="" disabled>Select an annotation document…</option>
          {annotations.map(ann => (
            <option key={ann._id} value={ann._id}>
              {ann.annotation.name} · {ann._elementCount ?? '?'} elements
            </option>
          ))}
        </select>
        {activeId && (
          <div className="audit-line">
            Active: <span className="mono">{activeId}</span>
          </div>
        )}
      </div>

      <div className="section">
        <h2>Per-document stats</h2>
        <div className="label-line">
          <span>Total detections</span>
          <span className="num">{stats.totalDetections}</span>
        </div>
        <div className="label-line">
          <span>ROIs</span>
          <span className="num">{stats.rois.length}</span>
        </div>
        <div className="label-line">
          <span>Mean confidence</span>
          <span className="num">{stats.overallMeanConfidence?.toFixed(3) ?? '—'}</span>
        </div>
        <div className="label-line">
          <span>Orphaned</span>
          <span className="num">{stats.orphanCount}</span>
        </div>
      </div>

      <div className="section">
        <h2>Export</h2>
        <button
          className="btn full"
          disabled={elements.length === 0}
          onClick={() => exportElements(slideName, itemId, elements)}
        >
          Download CSV of detections
        </button>
        <div className="audit-line">
          Exports the active annotation document verbatim. No filtering applied.
        </div>
      </div>

      <div className="section">
        <h2>Save</h2>
        <button className="btn primary full" disabled={saveState === 'saving' || saveState === 'clean'}>
          Save to DSA
        </button>
      </div>
    </aside>
  )
}
