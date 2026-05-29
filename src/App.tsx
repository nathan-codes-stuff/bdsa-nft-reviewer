import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Login } from './routes/Login'
import { Browse } from './routes/Browse'
import { Slide } from './routes/Slide'
import { ModeProvider } from './context/ModeContext'
import { RequireAuth } from './routes/RequireAuth'

export function App() {
  return (
    <ModeProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/browse"
            element={
              <RequireAuth>
                <Browse />
              </RequireAuth>
            }
          />
          <Route
            path="/slide/:itemId"
            element={
              <RequireAuth>
                <Slide />
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </ModeProvider>
  )
}
