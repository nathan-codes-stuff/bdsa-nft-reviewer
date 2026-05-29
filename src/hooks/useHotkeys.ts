import { useEffect } from 'react'

export interface HotkeyMap {
  [combo: string]: (e: KeyboardEvent) => void
}

/** Lowercase key combo, e.g. "arrowright", "a", "shift+s". */
function comboFor(e: KeyboardEvent): string {
  const parts: string[] = []
  if (e.ctrlKey) parts.push('ctrl')
  if (e.metaKey) parts.push('meta')
  if (e.altKey) parts.push('alt')
  if (e.shiftKey) parts.push('shift')
  parts.push(e.key.toLowerCase())
  return parts.join('+')
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName.toLowerCase()
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true
  if (target.isContentEditable) return true
  return false
}

export function useHotkeys(map: HotkeyMap, enabled = true): void {
  useEffect(() => {
    if (!enabled) return
    function handler(e: KeyboardEvent) {
      if (isTypingTarget(e.target)) return
      const combo = comboFor(e)
      const fn = map[combo]
      if (fn) {
        e.preventDefault()
        fn(e)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [map, enabled])
}
