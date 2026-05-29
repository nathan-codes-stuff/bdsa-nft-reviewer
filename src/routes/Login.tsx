import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { DsaAuthManager } from 'bdsa-react-components'
import { useAuthStatus } from '../hooks/useAuthStatus'

export function Login() {
  const status = useAuthStatus()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname || '/browse'

  useEffect(() => {
    if (status.isAuthenticated) {
      navigate(from, { replace: true })
    }
  }, [status.isAuthenticated, from, navigate])

  return (
    <div className="centered-page">
      <div className="card">
        <h1>BDSA NFT Reviewer</h1>
        <p>
          Log in to a Digital Slide Archive server to review YOLOv5-detected neurofibrillary tangles on
          Alzheimer's brain slides.
        </p>
        <DsaAuthManager allowServerConfig={true} />
      </div>
    </div>
  )
}
