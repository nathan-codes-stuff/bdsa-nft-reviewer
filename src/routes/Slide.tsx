import { useParams } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader'
import { Workspace } from '../components/Workspace'

export function Slide() {
  const { itemId } = useParams<{ itemId: string }>()

  if (!itemId) {
    return (
      <div className="centered-page">
        <div className="card">
          <h1>Missing slide ID</h1>
          <p>No DSA item ID in the URL.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <AppHeader />
      <div className="app-body">
        <Workspace itemId={itemId} />
      </div>
    </div>
  )
}
