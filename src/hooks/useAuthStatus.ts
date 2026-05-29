import { useEffect, useState } from 'react'
import { dsaAuthStore } from 'bdsa-react-components'
import type { DsaAuthStatus } from 'bdsa-react-components'

/** Subscribe to dsaAuthStore and re-render on auth changes. */
export function useAuthStatus(): DsaAuthStatus {
  const [status, setStatus] = useState<DsaAuthStatus>(() => dsaAuthStore.getStatus())

  useEffect(() => {
    const unsubscribe = dsaAuthStore.subscribe(() => {
      setStatus(dsaAuthStore.getStatus())
    })
    return unsubscribe
  }, [])

  return status
}
