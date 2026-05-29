import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type ReviewerMode = 'pathologist' | 'researcher'

interface ModeContextValue {
  mode: ReviewerMode
  setMode: (m: ReviewerMode) => void
}

const ModeContext = createContext<ModeContextValue | null>(null)

const STORAGE_KEY = 'bdsa_nft_reviewer_mode'

export function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ReviewerMode>(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === 'researcher' ? 'researcher' : 'pathologist'
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, mode)
  }, [mode])

  return <ModeContext.Provider value={{ mode, setMode }}>{children}</ModeContext.Provider>
}

export function useMode(): ModeContextValue {
  const ctx = useContext(ModeContext)
  if (!ctx) throw new Error('useMode must be used inside <ModeProvider>')
  return ctx
}
