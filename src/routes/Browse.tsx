import { useNavigate } from 'react-router-dom'
import { FolderBrowser } from 'bdsa-react-components'
import { AppHeader } from '../components/AppHeader'

const SLIDE_EXTENSIONS = ['svs', 'tif', 'tiff', 'ndpi', 'czi', 'mrxs', 'scn', 'vms', 'vmu']

export function Browse() {
  const navigate = useNavigate()

  return (
    <div className="app-shell">
      <AppHeader showModeToggle={false} />
      <div className="app-body" style={{ display: 'grid', gridTemplateColumns: '300px 1fr' }}>
        <FolderBrowser
          allowedExtensions={SLIDE_EXTENSIONS}
          onItemSelect={(item: { _id: string }) => navigate(`/slide/${item._id}`)}
        />
        <div className="browse-grid">
          <div className="empty-state">
            <p>Select a slide from the folder tree to open the reviewer.</p>
            <p className="mono">Filtered to: {SLIDE_EXTENSIONS.join(', ')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
