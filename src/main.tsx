import React from 'react'
import ReactDOM from 'react-dom/client'
import { PublicClientApplication } from '@azure/msal-browser'
import App from './App'
import './index.css'

const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_MSAL_CLIENT_ID || '',
    authority: import.meta.env.VITE_MSAL_AUTHORITY || '',
    redirectUri: `${window.location.origin}/welcome`,
  },
  cache: {
    cacheLocation: 'sessionStorage' as const,
    storeAuthStateInCookie: false,
  },
}

const msalInstance = new PublicClientApplication(msalConfig)

msalInstance.initialize().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App msalInstance={msalInstance} />
    </React.StrictMode>,
  )
})
