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

const AppContent = () => {
  const { isAuthenticated, setTokenInApi } = useAuth()
  const displayName = localStorage.getItem('displayName')

  return (
    <WebSocketProvider wsUrl={import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:5000'} onConnected={async () => {
      await setTokenInApi()
      const ticket = await apiClient.getWebSocketTicket()
      return ticket
    }}>
      <BrowserRouter>
        <Routes>
          <Route path="/welcome" element={<LandingPage />} />
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
          <Route path="/" element={<Navigate to="/welcome" />} />
        </Routes>
      </BrowserRouter>
    </WebSocketProvider>
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
