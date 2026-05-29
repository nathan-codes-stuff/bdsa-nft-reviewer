import { useMode } from '../context/ModeContext'

export function ModeToggle() {
  const { mode, setMode } = useMode()
  return (
    <div className="mode-toggle" role="tablist" aria-label="Reviewer mode">
      <button
        role="tab"
        aria-selected={mode === 'pathologist'}
        className={mode === 'pathologist' ? 'active' : ''}
        onClick={() => setMode('pathologist')}
      >
        Pathologist
      </button>
      <button
        role="tab"
        aria-selected={mode === 'researcher'}
        className={mode === 'researcher' ? 'active' : ''}
        onClick={() => setMode('researcher')}
      >
        Researcher
      </button>
    </div>
  )
}
