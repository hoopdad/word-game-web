import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useWebSocket } from '@/context/WebSocketContext';
import './GameScreen.css';
export const GameScreen = () => {
    const { send, on, off } = useWebSocket();
    const [gameStatus, setGameStatus] = useState('waiting');
    const [role, setRole] = useState(null);
    const [word, setWord] = useState(null);
    const [guesser, setGuesser] = useState(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [categories, setCategories] = useState([]);
    const [guesses, setGuesses] = useState([]);
    const [guessInput, setGuessInput] = useState('');
    const [timeRemaining, setTimeRemaining] = useState(120);
    const [countdown, setCountdown] = useState(10);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [gameResult, setGameResult] = useState(null);
    useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handleGameStatus = (data) => setGameStatus(data.status);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handleRoleAssignment = (data) => {
            setRole(data.role);
            setGuesser(data.guesser);
            setCountdown(10);
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handleCategoriesReady = (data) => setCategories(data.categories);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handleRoundStart = (data) => {
            if (data.role === 'cluegiver') {
                setWord(data.word);
            }
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handleGuessSubmitted = (data) => {
            setGuesses((prev) => [...prev, `${data.user}: ${data.guess}`]);
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handleGuessCorrect = (data) => {
            if (role === 'guesser') {
                setWord(data.word);
            }
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handleTimer = (data) => setTimeRemaining(data.remainingSeconds);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handleCountdown = (data) => setCountdown(data.remaining);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handleGameEnd = (data) => setGameResult(data);
        on('game_status_updated', handleGameStatus);
        on('role_assigned', handleRoleAssignment);
        on('categories_ready', handleCategoriesReady);
        on('round_started', handleRoundStart);
        on('guess_submitted', handleGuessSubmitted);
        on('guess_correct', handleGuessCorrect);
        on('timer_tick', handleTimer);
        on('countdown_tick', handleCountdown);
        on('game_ended', handleGameEnd);
        return () => {
            off('game_status_updated', handleGameStatus);
            off('role_assigned', handleRoleAssignment);
            off('categories_ready', handleCategoriesReady);
            off('round_started', handleRoundStart);
            off('guess_submitted', handleGuessSubmitted);
            off('guess_correct', handleGuessCorrect);
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
    if (gameStatus === 'role_assignment' || countdown > 0) {
        return (_jsx("div", { className: "game-screen", children: _jsxs("div", { className: "game-content", children: [_jsx("h2", { children: "Preparing for round..." }), _jsx("p", { className: "role-display", children: role === 'guesser'
                            ? `You are the GUESSER`
                            : `You are a CLUE-GIVER` }), _jsxs("p", { className: "guesser-info", children: ["Guesser: ", guesser] }), _jsx("div", { className: "countdown", children: countdown })] }) }));
    }
    return (_jsxs("div", { className: "game-screen", children: [_jsxs("div", { className: "game-header", children: [_jsx("h1", { children: "Round in Progress" }), _jsxs("div", { className: "timer", children: [Math.floor(timeRemaining / 60), ":", String(timeRemaining % 60).padStart(2, '0')] })] }), _jsx("div", { className: "game-content", children: role === 'cluegiver' ? (_jsxs("div", { className: "cluegiver-view", children: [_jsx("div", { className: "word-display", children: word || '...' }), _jsxs("div", { className: "guesses-display", children: [_jsx("h3", { children: "Guesses:" }), guesses.length > 0 ? (guesses.map((guess, idx) => (_jsx("div", { className: "guess-item", children: guess }, idx)))) : (_jsx("p", { children: "Waiting for guesses..." }))] }), _jsx("button", { className: "primary-button", onClick: handleMarkCorrect, children: "Correct!" })] })) : (_jsxs("div", { className: "guesser-view", children: [word && _jsxs("div", { className: "word-reveal", children: ["\uD83C\uDF89 Correct! The word was: ", word] }), _jsxs("form", { onSubmit: handleSubmitGuess, children: [_jsx("input", { type: "text", value: guessInput, onChange: (e) => setGuessInput(e.target.value), placeholder: "Enter your guess...", className: "guess-input" }), _jsx("button", { type: "submit", className: "primary-button", children: "Submit Guess" })] })] })) })] }));
};
