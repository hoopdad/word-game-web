import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLocalStorage } from '@/hooks/useCustomHooks';
import './LandingPage.css';
export const LandingPage = () => {
    const { login, isAuthenticated } = useAuth();
    const [darkMode, setDarkMode] = useLocalStorage('darkMode', false);
    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
        if (!darkMode) {
            document.documentElement.classList.add('dark-mode');
        }
        else {
            document.documentElement.classList.remove('dark-mode');
        }
    };
    if (isAuthenticated) {
        return _jsx(Navigate, { to: "/register", replace: true });
    }
    return (_jsxs("div", { className: `landing-page ${darkMode ? 'dark' : 'light'}`, children: [_jsx("header", { className: "landing-header", children: _jsxs("div", { className: "landing-nav", children: [_jsx("h1", { className: "app-title", children: "Word Game" }), _jsx("button", { className: "theme-toggle", onClick: toggleDarkMode, "aria-label": "Toggle dark mode", children: darkMode ? '☀️' : '🌙' })] }) }), _jsxs("main", { className: "landing-main", children: [_jsxs("section", { className: "hero", children: [_jsx("h2", { children: "Welcome to Word Game" }), _jsx("p", { children: "Experience the thrill of real-time multiplayer word guessing. Challenge your friends, test your vocabulary, and climb the leaderboard!" }), _jsx("button", { className: "cta-button", onClick: login, children: "Log In / Sign Up" })] }), _jsxs("section", { className: "features", children: [_jsxs("div", { className: "feature-card", children: [_jsx("h3", { children: "\uD83C\uDFAE Real-Time Gameplay" }), _jsx("p", { children: "Play live with friends using WebSocket technology for instant updates." })] }), _jsxs("div", { className: "feature-card", children: [_jsx("h3", { children: "\uD83C\uDFC6 Leaderboards" }), _jsx("p", { children: "Track your performance across daily and all-time rankings." })] }), _jsxs("div", { className: "feature-card", children: [_jsx("h3", { children: "\uD83D\uDCDA Custom Categories" }), _jsx("p", { children: "Add your own word categories to make the game your own." })] })] })] }), _jsx("footer", { className: "landing-footer", children: _jsx("p", { children: "\u00A9 2024 Word Game. All rights reserved." }) })] }));
};
