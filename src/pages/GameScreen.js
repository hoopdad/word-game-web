import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '@/context/WebSocketContext';
import './GameScreen.css';
export const GameScreen = () => {
    const { send, on, off } = useWebSocket();
    const [gameStatus, setGameStatus] = useState('gathering_categories');
    const [role, setRole] = useState(null);
    const [word, setWord] = useState(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [categories, setCategories] = useState([]);
    const [guesses, setGuesses] = useState([]);
    const [guessInput, setGuessInput] = useState('');
    const [timeRemaining, setTimeRemaining] = useState(120);
    const [countdown, setCountdown] = useState(10);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [gameResult, setGameResult] = useState(null);
    const userIdRef = useRef(null);
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
                setGameStatus(data.status);
            }
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handleCategoryOverview = (data) => {
            setCategories(Array.isArray(data.categories) ? data.categories : []);
            setGameStatus('categories_ready');
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handleRoundStart = (data) => {
            const isGuesser = data.guesser_id === userIdRef.current;
            setRole(isGuesser ? 'guesser' : 'cluegiver');
            setGuesses([]);
            setWord(null);
            setCountdown(typeof data.remaining === 'number' ? data.remaining : 10);
            if (!isGuesser && typeof data.word === 'string') {
                setWord(data.word);
            }
            if (typeof data.status === 'string') {
                setGameStatus(data.status);
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
            if (role === 'guesser' && typeof data.word === 'string') {
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
            if (typeof data.remaining === 'number') {
                setCountdown(data.remaining);
            }
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handleGameEnd = (data) => setGameResult(data);
        on('connected', handleConnected);
        on('game_started', handleGameStatus);
        on('category_overview', handleCategoryOverview);
        on('round_started', handleRoundStart);
        on('guess_submitted', handleGuessSubmitted);
        on('score_updated', handleScoreUpdated);
        on('timer_tick', handleTimer);
        on('countdown_tick', handleCountdown);
        on('game_ended', handleGameEnd);
        return () => {
            off('connected', handleConnected);
            off('game_started', handleGameStatus);
            off('category_overview', handleCategoryOverview);
            off('round_started', handleRoundStart);
            off('guess_submitted', handleGuessSubmitted);
            off('score_updated', handleScoreUpdated);
            off('timer_tick', handleTimer);
            off('countdown_tick', handleCountdown);
            off('game_ended', handleGameEnd);
        };
    }, [on, off, role]);
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
    const handleStartRound = () => {
        send({ type: 'start_round' });
    };
    if (gameResult) {
        return (_jsx("div", { className: "game-screen gathering", children: _jsxs("div", { className: "game-content", children: [_jsx("h1", { children: "\uD83C\uDF89 Game Over!" }), _jsxs("p", { children: ["Winners: ", gameResult.winners.join(', ')] }), _jsx("div", { className: "scores-list", children: gameResult.scores.map((score) => (_jsxs("div", { className: "score-item", children: [score.displayName, ": ", score.points] }, score.userId))) }), _jsx("p", { style: { marginTop: '2rem', color: '#999' }, children: "Returning to dashboard..." })] }) }));
    }
    if (gameStatus === 'gathering_categories') {
        return (_jsxs("div", { className: "game-screen gathering", children: [_jsx("h2", { children: "Gathering categories..." }), _jsx("div", { className: "spinner" })] }));
    }
    if (gameStatus === 'categories_ready') {
        return (_jsx("div", { className: "game-screen", children: _jsxs("div", { className: "game-content", children: [_jsx("h1", { children: "Category Overview" }), _jsx("div", { className: "categories-list", children: categories.map((cat, idx) => (_jsx("div", { className: "category-item", children: cat.name || cat.url }, idx))) }), _jsx("button", { className: "primary-button", onClick: handleStartRound, children: "Start First Round" })] }) }));
    }
    if (gameStatus !== 'round_active') {
        return (_jsx("div", { className: "game-screen", children: _jsxs("div", { className: "game-content", children: [_jsx("h2", { children: "Preparing for round..." }), _jsx("p", { className: "role-display", children: role === null
                            ? 'Assigning roles...'
                            : role === 'guesser'
                                ? `You are the GUESSER`
                                : `You are a CLUE-GIVER` }), _jsx("div", { className: "countdown", children: countdown })] }) }));
    }
    return (_jsxs("div", { className: "game-screen", children: [_jsxs("div", { className: "game-header", children: [_jsx("h1", { children: "Round in Progress" }), _jsxs("div", { className: "timer", children: [Math.floor(timeRemaining / 60), ":", String(timeRemaining % 60).padStart(2, '0')] })] }), _jsx("div", { className: "game-content", children: role === 'cluegiver' ? (_jsxs("div", { className: "cluegiver-view", children: [_jsx("div", { className: "word-display", children: word || '...' }), _jsxs("div", { className: "guesses-display", children: [_jsx("h3", { children: "Guesses:" }), guesses.length > 0 ? (guesses.map((guess, idx) => (_jsx("div", { className: "guess-item", children: guess }, idx)))) : (_jsx("p", { children: "Waiting for guesses..." }))] }), _jsx("button", { className: "primary-button", onClick: handleMarkCorrect, children: "Correct!" })] })) : (_jsxs("div", { className: "guesser-view", children: [word && _jsxs("div", { className: "word-reveal", children: ["\uD83C\uDF89 Correct! The word was: ", word] }), _jsxs("form", { onSubmit: handleSubmitGuess, children: [_jsx("input", { type: "text", value: guessInput, onChange: (e) => setGuessInput(e.target.value), placeholder: "Enter your guess...", className: "guess-input" }), _jsx("button", { type: "submit", className: "primary-button", children: "Submit Guess" })] })] })) })] }));
};
