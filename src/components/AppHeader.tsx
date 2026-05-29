import { Link, useNavigate } from 'react-router-dom'
import { dsaAuthStore } from 'bdsa-react-components'
import { useAuthStatus } from '../hooks/useAuthStatus'
import { ModeToggle } from './ModeToggle'
import type { ReactNode } from 'react'

interface AppHeaderProps {
  /** Slot for save-state pill, slide name, etc. */
  right?: ReactNode
  center?: ReactNode
  showModeToggle?: boolean
}

export function AppHeader({ right, center, showModeToggle = true }: AppHeaderProps) {
  const status = useAuthStatus()
  const navigate = useNavigate()

  return (
    <header className="app-header">
      <Link to="/browse" style={{ color: 'var(--text)' }}>
        <h1>BDSA NFT Reviewer</h1>
      </Link>
      {center}
      <div className="spacer" />
      {showModeToggle && <ModeToggle />}
      {right}
      {status.user && (
        <span className="user-pill" title={status.serverUrl || ''}>
          {status.user.name}
        </span>
      )}
      <button
        className="logout-btn"
        onClick={() => {
          dsaAuthStore.logout()
          navigate('/login', { replace: true })
        }}
      >
        Log out
      </button>
    </header>
  )
}
