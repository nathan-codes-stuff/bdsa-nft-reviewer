export type SaveState = 'clean' | 'dirty' | 'saving' | 'saved' | 'error'

const LABELS: Record<SaveState, string> = {
  clean: 'No changes',
  dirty: 'Unsaved changes',
  saving: 'Saving…',
  saved: 'Saved',
  error: 'Save failed',
}

export function SavePill({ state }: { state: SaveState }) {
  return (
    <span className={`save-pill ${state}`} aria-live="polite" data-state={state}>
      {LABELS[state]}
    </span>
  )
}
