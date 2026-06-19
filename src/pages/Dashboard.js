import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWebSocket } from '@/context/WebSocketContext';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/services/apiClient';
import './Dashboard.css';
export const Dashboard = () => {
    const navigate = useNavigate();
    const { on, off } = useWebSocket();
    const { logout, setTokenInApi, isAuthenticated } = useAuth();
    const [activeUsers, setActiveUsers] = useState([]);
    const [gameCount, setGameCount] = useState(0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [allTimeLeaderboard, setAllTimeLeaderboard] = useState([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [todayLeaderboard, setTodayLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [lastGameResult, setLastGameResult] = useState(null);
    useEffect(() => {
        if (!isAuthenticated)
            return;
        let cancelled = false;
        const pollActiveUsers = async () => {
            try {
                await setTokenInApi();
                const users = await apiClient.getActiveUsers();
                if (!cancelled) {
                    setActiveUsers([...new Set(users)]);
                }
            }
            catch (error) {
                console.error('Failed to refresh active users:', error);
            }
        };
        const intervalId = setInterval(pollActiveUsers, 30000);
        return () => {
            cancelled = true;
            clearInterval(intervalId);
        };
    }, [isAuthenticated, setTokenInApi]);
    useEffect(() => {
        const fetchData = async () => {
            if (!isAuthenticated)
                return;
            try {
                // Ensure token is set before making API calls
                await setTokenInApi();
                const [gameCountData, allTimeData, todayData, activeData] = await Promise.all([
                    apiClient.getGameCount(),
                    apiClient.getAllTimeLeaderboard(),
                    apiClient.getTodayLeaderboard(),
                    apiClient.getActiveUsers(),
                ]);
                setGameCount(gameCountData);
                setAllTimeLeaderboard(allTimeData);
                setTodayLeaderboard(todayData);
                setActiveUsers(activeData);
            }
            catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            }
            finally {
                setLoading(false);
            }
        };
        fetchData();
        // Subscribe to WebSocket events
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handleUserJoined = (data) => {
            const username = data.display_name || data.user;
            if (!username) {
                console.error('user_joined event missing user identity', data);
                return;
            }
            setActiveUsers((prev) => {
                const newUsers = [...prev, username];
                return [...new Set(newUsers)];
            });
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handleUserLeft = (data) => {
            const username = data.display_name || data.user;
            if (!username) {
                console.error('user_left event missing user identity', data);
                return;
            }
            setActiveUsers((prev) => prev.filter((user) => user !== username));
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handleGameEnded = (data) => {
            setLastGameResult(data);
            // Auto-clear celebration after 5 seconds
            setTimeout(() => setLastGameResult(null), 5000);
        };
        on('user_joined', handleUserJoined);
        on('user_left', handleUserLeft);
        on('game_ended', handleGameEnded);
        return () => {
            off('user_joined', handleUserJoined);
            off('user_left', handleUserLeft);
            off('game_ended', handleGameEnded);
        };
    }, [on, off, setTokenInApi, isAuthenticated]);
    const handleStartGame = async () => {
        try {
            await setTokenInApi();
            await apiClient.startGame();
            navigate('/game');
        }
        catch (error) {
            console.error('Failed to start game:', error);
        }
    };
    return (_jsxs("div", { className: "dashboard-container", children: [_jsxs("header", { className: "dashboard-header", children: [_jsx("h1", { children: "Dashboard" }), _jsxs("div", { className: "dashboard-actions", children: [_jsx("button", { className: "nav-button", onClick: () => navigate('/profile'), children: "Profile" }), _jsx("button", { className: "nav-button", onClick: () => navigate('/categories'), children: "Configure Categories" }), _jsx("button", { className: "logout-button", onClick: logout, children: "Logout" })] })] }), lastGameResult && (_jsxs("div", { className: "post-game-status", children: ["\uD83C\uDF89 Congratulations to ", lastGameResult.winners.join(', '), "! \uD83C\uDF89"] })), _jsx("main", { className: "dashboard-main", children: loading ? (_jsx("div", { className: "loading", children: "Loading dashboard..." })) : (_jsxs(_Fragment, { children: [_jsxs("section", { className: "cards-grid", children: [_jsxs("div", { className: "card active-users-card", children: [_jsx("h2", { children: "Active Users" }), _jsx("div", { className: "users-list", children: activeUsers.length > 0 ? (activeUsers.map((user) => (_jsxs("div", { className: "user-item", children: ["\uD83D\uDFE2 ", user] }, user)))) : (_jsx("p", { children: "No users currently online" })) })] }), _jsxs("div", { className: "card game-count-card", children: [_jsx("h2", { children: "Games Played" }), _jsx("div", { className: "big-number", children: gameCount }), _jsx("p", { children: "total games across all players" })] }), _jsxs("div", { className: "card top-all-time-card", children: [_jsx("h2", { children: "All-Time Top 10" }), _jsx("ol", { className: "leaderboard", children: allTimeLeaderboard.slice(0, 10).map((entry, idx) => (_jsxs("li", { children: [_jsxs("span", { className: "rank", children: [idx + 1, "."] }), _jsx("span", { className: "name", children: entry.displayName }), _jsx("span", { className: "points", children: entry.points })] }, entry.userId))) })] }), _jsxs("div", { className: "card top-today-card", children: [_jsx("h2", { children: "Today's Top 3" }), _jsx("ol", { className: "leaderboard", children: todayLeaderboard.slice(0, 3).map((entry, idx) => (_jsxs("li", { children: [_jsxs("span", { className: "rank", children: [idx + 1, "."] }), _jsx("span", { className: "name", children: entry.displayName }), _jsx("span", { className: "points", children: entry.points })] }, entry.userId))) })] })] }), _jsx("section", { className: "game-controls", children: activeUsers.length >= 2 && (_jsx("button", { className: "start-game-button", onClick: handleStartGame, children: "Start Game" })) })] })) })] }));
};
