import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MsalProvider } from '@azure/msal-react';
import { PublicClientApplication } from '@azure/msal-browser';
import { WebSocketProvider } from '@/context/WebSocketContext';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/services/apiClient';
import { LandingPage } from '@/pages/LandingPage';
import { NameEntry } from '@/pages/NameEntry';
import { Dashboard } from '@/pages/Dashboard';
import { GameScreen } from '@/pages/GameScreen';
import { CategoryConfig } from '@/pages/CategoryConfig';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import './App.css';
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
};
const msalInstance = new PublicClientApplication(msalConfig);
const wsUrl = import.meta.env.VITE_WS_BASE_URL ||
    (typeof window !== 'undefined'
        ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`
        : 'ws://localhost:5000/ws');
const AuthenticatedRoutes = () => {
    const { isAuthenticated, setTokenInApi } = useAuth();
    const displayName = localStorage.getItem('displayName');
    return (_jsx(WebSocketProvider, { wsUrl: wsUrl, onConnected: async () => {
            await setTokenInApi();
            const ticket = await apiClient.getWebSocketTicket();
            return ticket;
        }, children: _jsxs(Routes, { children: [_jsx(Route, { path: "/register", element: _jsx(ProtectedRoute, { requiredAuth: true, children: isAuthenticated && !displayName ? _jsx(NameEntry, {}) : _jsx(Navigate, { to: "/dashboard" }) }) }), _jsx(Route, { path: "/dashboard", element: _jsx(ProtectedRoute, { requiredAuth: true, children: isAuthenticated && displayName ? _jsx(Dashboard, {}) : _jsx(Navigate, { to: "/register" }) }) }), _jsx(Route, { path: "/game", element: _jsx(ProtectedRoute, { requiredAuth: true, children: isAuthenticated && displayName ? _jsx(GameScreen, {}) : _jsx(Navigate, { to: "/register" }) }) }), _jsx(Route, { path: "/categories", element: _jsx(ProtectedRoute, { requiredAuth: true, children: isAuthenticated && displayName ? _jsx(CategoryConfig, {}) : _jsx(Navigate, { to: "/register" }) }) })] }) }));
};
const AppContent = () => {
    const { isAuthenticated } = useAuth();
    return (_jsx(BrowserRouter, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/welcome", element: _jsx(LandingPage, {}) }), isAuthenticated && _jsx(Route, { path: "/*", element: _jsx(AuthenticatedRoutes, {}) }), _jsx(Route, { path: "/", element: _jsx(Navigate, { to: "/welcome" }) }), !isAuthenticated && _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/welcome" }) })] }) }));
};
const App = () => {
    return (_jsx(MsalProvider, { instance: msalInstance, children: _jsx(AppContent, {}) }));
};
export default App;
