import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { MsalProvider } from '@azure/msal-react'
import { PublicClientApplication } from '@azure/msal-browser'
import { WebSocketProvider } from '@/context/WebSocketContext'
import { useAuth } from '@/hooks/useAuth'
import apiClient from '@/services/apiClient'
import { LandingPage } from '@/pages/LandingPage'
import { NameEntry } from '@/pages/NameEntry'
import { Dashboard } from '@/pages/Dashboard'
import { GameScreen } from '@/pages/GameScreen'
import { CategoryConfig } from '@/pages/CategoryConfig'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import './App.css'

const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_MSAL_CLIENT_ID || '',
    authority: import.meta.env.VITE_MSAL_AUTHORITY || '',
    redirectUri: import.meta.env.VITE_MSAL_REDIRECT_URI || 'http://localhost:3000/welcome',
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
}

const msalInstance = new PublicClientApplication(msalConfig)

const wsUrl = import.meta.env.VITE_WS_BASE_URL ||
  (typeof window !== 'undefined'
    ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`
    : 'ws://localhost:5000/ws')

const AuthenticatedRoutes = () => {
  const { isAuthenticated, setTokenInApi } = useAuth()
  const displayName = localStorage.getItem('displayName')

  return (
    <WebSocketProvider wsUrl={wsUrl} onConnected={async () => {
      await setTokenInApi()
      const ticket = await apiClient.getWebSocketTicket()
      return ticket
    }}>
      <Routes>
        <Route
          path="/register"
          element={
            <ProtectedRoute requiredAuth={true}>
              {isAuthenticated && !displayName ? <NameEntry /> : <Navigate to="/dashboard" />}
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requiredAuth={true}>
              {isAuthenticated && displayName ? <Dashboard /> : <Navigate to="/register" />}
            </ProtectedRoute>
          }
        />
        <Route
          path="/game"
          element={
            <ProtectedRoute requiredAuth={true}>
              {isAuthenticated && displayName ? <GameScreen /> : <Navigate to="/register" />}
            </ProtectedRoute>
          }
        />
        <Route
          path="/categories"
          element={
            <ProtectedRoute requiredAuth={true}>
              {isAuthenticated && displayName ? <CategoryConfig /> : <Navigate to="/register" />}
            </ProtectedRoute>
          }
        />
      </Routes>
    </WebSocketProvider>
  )
}

const AppContent = () => {
  const { isAuthenticated } = useAuth()

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/welcome" element={<LandingPage />} />
        {isAuthenticated && <Route path="/*" element={<AuthenticatedRoutes />} />}
        <Route path="/" element={<Navigate to="/welcome" />} />
        {!isAuthenticated && <Route path="*" element={<Navigate to="/welcome" />} />}
      </Routes>
    </BrowserRouter>
  )
}

const App = () => {
  return (
    <MsalProvider instance={msalInstance}>
      <AppContent />
    </MsalProvider>
  )
}

export default App
