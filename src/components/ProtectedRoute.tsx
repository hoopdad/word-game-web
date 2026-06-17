import { ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import './ProtectedRoute.css'

interface ProtectedRouteProps {
  children: ReactNode
  requiredAuth?: boolean
}

export const ProtectedRoute = ({ children, requiredAuth = true }: ProtectedRouteProps) => {
  const { isAuthenticated, login } = useAuth()

  if (requiredAuth && !isAuthenticated) {
    return (
      <div className="protected-route-container">
        <div className="protected-route-content">
          <h1>Access Denied</h1>
          <p>You need to be logged in to access this page.</p>
          <button onClick={login} className="login-button">
            Log In
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
