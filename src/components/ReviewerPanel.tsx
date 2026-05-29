import { SavePill, type SaveState } from './SavePill'

interface ReviewerPanelProps {
  saveState: SaveState
  onSave: () => void
  confidenceThreshold: number
  onConfidenceChange: (v: number) => void
  reviewIndex: number
  reviewTotal: number
  modelLabel: string
}

function fmtConf(n: number): string {
  return n.toFixed(3)
}

export function ReviewerPanel({
  saveState,
  onSave,
  confidenceThreshold,
  onConfidenceChange,
  reviewIndex,
  reviewTotal,
  modelLabel,
}: ReviewerPanelProps) {
  return (
    <aside className="rail" aria-label="Reviewer controls">
      <div className="section">
        <h2>Save</h2>
        <SavePill state={saveState} />
        <button
          className="btn primary full"
          style={{ marginTop: 10 }}
          onClick={onSave}
          disabled={saveState === 'saving' || saveState === 'clean'}
        >
          Save to DSA
        </button>
        <div className="audit-line">
          Original ML detections are preserved. Accept/reject writes a verdict on top.
        </div>
      </div>

      <div className="section">
        <h2>Model</h2>
        <div className="label-line">
          <span>Source</span>
          <span className="num">{modelLabel}</span>
        </div>
      </div>

      <div className="section">
        <h2>Confidence filter</h2>
        <div className="label-line">
          <span>Threshold</span>
          <span className="num">{fmtConf(confidenceThreshold)}</span>
        </div>
        <input
          className="slider"
          type="range"
          min={0}
          max={1}
          step={0.001}
          value={confidenceThreshold}
          onChange={e => onConfidenceChange(Number(e.target.value))}
          aria-label="Confidence threshold"
        />
        <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>
          Detections with confidence &lt; threshold are hidden, not removed.
        </div>
      </div>

      <div className="section">
        <h2>Review cursor</h2>
        <div className="label-line">
          <span>Position</span>
          <span className="num">
            {reviewTotal === 0 ? '—' : `${reviewIndex + 1} / ${reviewTotal}`}
          </span>
        </div>
      </div>

      <div className="section">
        <h2>Hotkeys</h2>
        <div className="hotkey-row"><span className="kbd">←</span><span className="kbd">→</span><span>Cycle detections</span></div>
        <div className="hotkey-row"><span className="kbd">A</span><span>Accept</span></div>
        <div className="hotkey-row"><span className="kbd">R</span><span>Reject</span></div>
        <div className="hotkey-row"><span className="kbd">Space</span><span>Toggle low-confidence</span></div>
        <div className="hotkey-row"><span className="kbd">S</span><span>Save</span></div>
      </div>
    </aside>
  )
}
