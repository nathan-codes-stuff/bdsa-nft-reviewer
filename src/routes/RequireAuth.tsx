import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStatus } from '../hooks/useAuthStatus'

export function RequireAuth({ children }: { children: JSX.Element }) {
  const status = useAuthStatus()
  const location = useLocation()

  if (!status.isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return children
}
