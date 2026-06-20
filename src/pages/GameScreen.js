import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWebSocket } from '@/context/WebSocketContext';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/services/apiClient';
import './GameScreen.css';
const normalizeGameStatus = (status) => {
    if (status === 'countdown' || status === 'round_active' || status === 'round_ended' || status === 'game_ended') {
        return status;
    }
    if (status === 'category_overview' || status === 'categories_ready') {
        return 'category_overview';
    }
    return 'gathering_categories';
};
const formatWinnerName = (winner) => {
    if (typeof winner === 'string') {
        return winner;
    }
    if (winner && typeof winner === 'object') {
        const payload = winner;
        if (typeof payload.display_name === 'string') {
            return payload.display_name;
        }
    }
    return '';
};
const formatScore = (score, index) => {
    if (!score || typeof score !== 'object') {
        return null;
    }
    const payload = score;
    const displayName = (typeof payload.display_name === 'string' && payload.display_name) ||
        (typeof payload.displayName === 'string' && payload.displayName) ||
        (typeof payload.user_id === 'string' && payload.user_id);
    if (!displayName) {
        return null;
    }
    const points = (typeof payload.total_points === 'number' && payload.total_points) ||
        (typeof payload.points === 'number' && payload.points) ||
        0;
    return {
        key: `${displayName}-${index}`,
        displayName,
        points,
    };
};
export const GameScreen = () => {
    const navigate = useNavigate();
    const { send, on, off } = useWebSocket();
    const { setTokenInApi } = useAuth();
    const [isHydrating, setIsHydrating] = useState(true);
    const [gameStatus, setGameStatus] = useState('gathering_categories');
    const [role, setRole] = useState(null);
    const [word, setWord] = useState(null);
    const [category, setCategory] = useState(null);
    const [categories, setCategories] = useState([]);
    const [guesses, setGuesses] = useState([]);
    const [guessInput, setGuessInput] = useState('');
    const [timeRemaining, setTimeRemaining] = useState(120);
    const [countdown, setCountdown] = useState(10);
    const [gameResult, setGameResult] = useState(null);
    const userIdRef = useRef(null);
    useEffect(() => {
        let mounted = true;
        const hydrateGameStatus = async () => {
            try {
                await setTokenInApi();
                const data = await apiClient.getGameStatus();
                if (!mounted)
                    return;
                if (data.status === 'idle' || !data.game_id) {
                    navigate('/dashboard', { replace: true });
                    return;
                }
                userIdRef.current = data.your_user_id;
                setRole(data.your_role);
                setCategory(data.current_category);
                setGameStatus(normalizeGameStatus(data.status));
                setTimeRemaining(typeof data.round_remaining === 'number' ? data.round_remaining : 120);
                setCountdown(typeof data.countdown_remaining === 'number' ? data.countdown_remaining : 10);
            }
            catch (error) {
                if (mounted) {
                    console.error('Failed to hydrate game status:', error);
                    navigate('/dashboard', { replace: true });
                }
            }
            finally {
                if (mounted) {
                    setIsHydrating(false);
                }
            }
        };
        hydrateGameStatus();
        return () => {
            mounted = false;
        };
    }, [navigate, setTokenInApi]);
    useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handleConnected = (data) => {
            if (typeof data.user_id === 'string') {
                userIdRef.current = data.user_id;
            }
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handleGameStatus = (data) => {
            if (typeof data.status === 'string') {
                setGameStatus(normalizeGameStatus(data.status));
            }
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handleCategoryOverview = (data) => {
            const incomingCategories = Array.isArray(data.categories) ? data.categories : [];
            setCategories(incomingCategories);
            setGameStatus('category_overview');
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handleRoundStarting = (data) => {
            const isGuesser = data.guesser_id === userIdRef.current;
            setRole(isGuesser ? 'guesser' : 'cluegiver');
            setCategory(typeof data.category === 'string' ? data.category : null);
            setCountdown(typeof data.countdown_remaining === 'number' ? data.countdown_remaining : 10);
            setGameStatus('countdown');
            setWord(null);
            setGuesses([]);
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handleRoundStarted = (data) => {
            const isGuesser = data.guesser_id === userIdRef.current;
            setRole(isGuesser ? 'guesser' : 'cluegiver');
            setCategory(typeof data.category === 'string' ? data.category : null);
            if (typeof data.round_remaining === 'number') {
                setTimeRemaining(data.round_remaining);
            }
            setGameStatus('round_active');
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handleWordShown = (data) => {
            if (typeof data.word === 'string') {
                setWord(data.word);
            }
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handleGuessSubmitted = (data) => {
            const username = data.display_name || data.user || 'Unknown';
            if (typeof data.guess === 'string' && data.guess.length > 0) {
                setGuesses((prev) => [...prev, `${username}: ${data.guess}`]);
            }
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handleScoreUpdated = (data) => {
            if (typeof data.word === 'string') {
                setWord(data.word);
            }
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handleTimer = (data) => {
            if (typeof data.remaining === 'number') {
                setTimeRemaining(data.remaining);
            }
            setGameStatus('round_active');
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handleCountdown = (data) => {
            if (typeof data.countdown_remaining === 'number') {
                setCountdown(data.countdown_remaining);
            }
            else if (typeof data.remaining === 'number') {
                setCountdown(data.remaining);
            }
            setGameStatus('countdown');
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handleRoundEnded = (data) => {
            if (typeof data.countdown_remaining === 'number') {
                setCountdown(data.countdown_remaining);
            }
            setGameStatus('round_ended');
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handleGameEnd = (data) => {
            setGameResult(data);
            setGameStatus('game_ended');
        };
        on('connected', handleConnected);
        on('game_started', handleGameStatus);
        on('category_overview', handleCategoryOverview);
        on('round_starting', handleRoundStarting);
        on('round_started', handleRoundStarted);
        on('word_shown', handleWordShown);
        on('guess_submitted', handleGuessSubmitted);
        on('score_updated', handleScoreUpdated);
        on('timer_tick', handleTimer);
        on('countdown_tick', handleCountdown);
        on('round_ended', handleRoundEnded);
        on('game_ended', handleGameEnd);
        return () => {
            off('connected', handleConnected);
            off('game_started', handleGameStatus);
            off('category_overview', handleCategoryOverview);
            off('round_starting', handleRoundStarting);
            off('round_started', handleRoundStarted);
            off('word_shown', handleWordShown);
            off('guess_submitted', handleGuessSubmitted);
            off('score_updated', handleScoreUpdated);
            off('timer_tick', handleTimer);
            off('countdown_tick', handleCountdown);
            off('round_ended', handleRoundEnded);
            off('game_ended', handleGameEnd);
        };
    }, [on, off]);
    useEffect(() => {
        if (!gameResult)
            return;
        const redirectTimer = window.setTimeout(() => {
            navigate('/dashboard');
        }, 5000);
        return () => {
            window.clearTimeout(redirectTimer);
        };
    }, [gameResult, navigate]);
    const handleSubmitGuess = (e) => {
        e.preventDefault();
        if (guessInput.trim()) {
            send({ type: 'submit_guess', guess: guessInput });
            setGuessInput('');
        }
    };
    const handleMarkCorrect = () => {
        send({ type: 'judge_correct' });
    };
    const roleLabel = role === null ? 'Assigning roles...' : role === 'guesser' ? 'You are the GUESSER' : 'You are a CLUE-GIVER';
    const winnerPayload = Array.isArray(gameResult?.winners) ? gameResult.winners : [];
    const scorePayload = Array.isArray(gameResult?.scores) ? gameResult.scores : [];
    const winners = winnerPayload.map(formatWinnerName).filter(Boolean);
    const scores = scorePayload
        .map((score, index) => formatScore(score, index))
        .filter((score) => score !== null);
    if (gameResult) {
        return (_jsx("div", { className: "game-screen gathering", children: _jsxs("div", { className: "game-content", children: [_jsx("h1", { children: "\uD83C\uDF89 Game Over!" }), _jsxs("p", { children: ["Winners: ", winners.length > 0 ? winners.join(', ') : 'No winners'] }), _jsx("div", { className: "scores-list", children: scores.length > 0 ? (scores.map((score) => (_jsxs("div", { className: "score-item", children: [score.displayName, ": ", score.points] }, score.key)))) : (_jsx("div", { className: "score-item", children: "No scores available" })) }), _jsx("p", { style: { marginTop: '2rem', color: '#999' }, children: "Returning to dashboard..." })] }) }));
    }
    if (isHydrating || gameStatus === 'gathering_categories') {
        return (_jsxs("div", { className: "game-screen gathering", children: [_jsx("h2", { children: "Gathering categories..." }), _jsx("div", { className: "spinner" })] }));
    }
    if (gameStatus === 'category_overview') {
        return (_jsx("div", { className: "game-screen", children: _jsxs("div", { className: "game-content", children: [_jsx("h1", { children: "Category Overview" }), _jsx("div", { className: "categories-list", children: categories.map((cat, idx) => (_jsx("div", { className: "category-item", children: cat.name || cat.url }, idx))) }), _jsx("p", { children: "Waiting for the next round to start..." })] }) }));
    }
    if (gameStatus !== 'round_active') {
        return (_jsx("div", { className: "game-screen", children: _jsxs("div", { className: "game-content", children: [_jsx("h2", { children: gameStatus === 'round_ended' ? 'Round complete!' : 'Preparing for round...' }), _jsxs("div", { className: "round-meta", children: [_jsx("span", { className: "role-badge", children: roleLabel }), category && _jsxs("span", { className: "category-badge", children: ["Category: ", category] })] }), (gameStatus === 'countdown' || gameStatus === 'round_ended') && _jsx("div", { className: "countdown", children: countdown })] }) }));
    }
    return (_jsxs("div", { className: "game-screen", children: [_jsxs("div", { className: "game-header", children: [_jsx("h1", { children: "Round in Progress" }), _jsxs("div", { className: "timer", children: [Math.floor(timeRemaining / 60), ":", String(timeRemaining % 60).padStart(2, '0')] })] }), _jsxs("div", { className: "game-content", children: [_jsxs("div", { className: "round-meta", children: [_jsx("span", { className: "role-badge", children: roleLabel }), category && _jsxs("span", { className: "category-badge", children: ["Category: ", category] })] }), role === 'cluegiver' ? (_jsxs("div", { className: "cluegiver-view", children: [_jsx("div", { className: "word-display", children: word || '...' }), _jsxs("div", { className: "guesses-display", children: [_jsx("h3", { children: "Guesses:" }), guesses.length > 0 ? (guesses.map((guess, idx) => (_jsx("div", { className: "guess-item", children: guess }, idx)))) : (_jsx("p", { children: "Waiting for guesses..." }))] }), _jsx("button", { className: "primary-button", onClick: handleMarkCorrect, children: "Correct!" })] })) : (_jsxs("div", { className: "guesser-view", children: [word && _jsxs("div", { className: "word-reveal", children: ["\uD83C\uDF89 Correct! The word was: ", word] }), _jsxs("form", { onSubmit: handleSubmitGuess, children: [_jsx("input", { type: "text", value: guessInput, onChange: (e) => setGuessInput(e.target.value), placeholder: "Enter your guess...", className: "guess-input" }), _jsx("button", { type: "submit", className: "primary-button", children: "Submit Guess" })] })] }))] })] }));
};
