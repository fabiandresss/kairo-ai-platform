import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { SettingsProvider } from './context/SettingsContext'
import { ThemeProvider } from './context/ThemeContext'
import { ToastProvider } from './context/ToastContext'
import AppShell from './components/layout/AppShell'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import { SkeletonList } from './components/ui/Misc'

const Chat = lazy(() => import('./pages/Chat'))
const Agents = lazy(() => import('./pages/Agents'))
const Workflows = lazy(() => import('./pages/Workflows'))
const Runs = lazy(() => import('./pages/Runs'))
const Integrations = lazy(() => import('./pages/Integrations'))
const Evaluations = lazy(() => import('./pages/Evaluations'))
const SettingsPage = lazy(() => import('./pages/Settings'))

function Protected() {
  const { user } = useAuth()
  return user ? <AppShell /> : <Navigate to="/login" replace />
}

function Page() {
  return (
    <Suspense fallback={<div className="p-6"><SkeletonList /></div>}>
      <Outlet />
    </Suspense>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <ToastProvider>
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route element={<Protected />}>
                  <Route element={<Page />}>
                    <Route path="/chat" element={<Chat />} />
                    <Route path="/agents" element={<Agents />} />
                    <Route path="/workflows" element={<Workflows />} />
                    <Route path="/runs" element={<Runs />} />
                    <Route path="/integrations" element={<Integrations />} />
                    <Route path="/evaluations" element={<Evaluations />} />
                    <Route path="/settings" element={<SettingsPage />} />
                  </Route>
                </Route>
                <Route path="*" element={<Navigate to="/chat" replace />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </ToastProvider>
      </SettingsProvider>
    </ThemeProvider>
  )
}
