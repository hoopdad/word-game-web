import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useAuth } from '@/hooks/useAuth';
import './ProtectedRoute.css';
export const ProtectedRoute = ({ children, requiredAuth = true }) => {
    const { isAuthenticated, login } = useAuth();
    if (requiredAuth && !isAuthenticated) {
        return (_jsx("div", { className: "protected-route-container", children: _jsxs("div", { className: "protected-route-content", children: [_jsx("h1", { children: "Access Denied" }), _jsx("p", { children: "You need to be logged in to access this page." }), _jsx("button", { onClick: login, className: "login-button", children: "Log In" })] }) }));
    }
    return _jsx(_Fragment, { children: children });
};
