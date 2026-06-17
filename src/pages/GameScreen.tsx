import React, { useState, useEffect } from 'react'
import { useWebSocket } from '@/context/WebSocketContext'
import './GameScreen.css'

export const GameScreen = () => {
  const { send, on, off } = useWebSocket()
  const [gameStatus, setGameStatus] = useState('waiting')
  const [role, setRole] = useState<'guesser' | 'cluegiver' | null>(null)
  const [word, setWord] = useState<string | null>(null)
  const [guesser, setGuesser] = useState<string | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [categories, setCategories] = useState<any[]>([])
  const [guesses, setGuesses] = useState<string[]>([])
  const [guessInput, setGuessInput] = useState('')
  const [timeRemaining, setTimeRemaining] = useState(120)
  const [countdown, setCountdown] = useState(10)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [gameResult, setGameResult] = useState<any | null>(null)

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleGameStatus = (data: any) => setGameStatus(data.status)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleRoleAssignment = (data: any) => {
      setRole(data.role)
      setGuesser(data.guesser)
      setCountdown(10)
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleCategoriesReady = (data: any) => setCategories(data.categories)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleRoundStart = (data: any) => {
      if (data.role === 'cluegiver') {
        setWord(data.word)
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleGuessSubmitted = (data: any) => {
      setGuesses((prev) => [...prev, `${data.user}: ${data.guess}`])
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleGuessCorrect = (data: any) => {
      if (role === 'guesser') {
        setWord(data.word)
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleTimer = (data: any) => setTimeRemaining(data.remainingSeconds)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleCountdown = (data: any) => setCountdown(data.remaining)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleGameEnd = (data: any) => setGameResult(data)

    on('game_status_updated', handleGameStatus)
    on('role_assigned', handleRoleAssignment)
    on('categories_ready', handleCategoriesReady)
    on('round_started', handleRoundStart)
    on('guess_submitted', handleGuessSubmitted)
    on('guess_correct', handleGuessCorrect)
    on('timer_tick', handleTimer)
    on('countdown_tick', handleCountdown)
    on('game_ended', handleGameEnd)

    return () => {
      off('game_status_updated', handleGameStatus)
      off('role_assigned', handleRoleAssignment)
      off('categories_ready', handleCategoriesReady)
      off('round_started', handleRoundStart)
      off('guess_submitted', handleGuessSubmitted)
      off('guess_correct', handleGuessCorrect)
      off('timer_tick', handleTimer)
      off('countdown_tick', handleCountdown)
      off('game_ended', handleGameEnd)
    }
  }, [on, off, role])

  const handleSubmitGuess = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (guessInput.trim()) {
      send({ type: 'submit_guess', guess: guessInput })
      setGuessInput('')
    }
  }

  const handleMarkCorrect = () => {
    send({ type: 'judge_correct' })
  }

  const handleStartRound = () => {
    send({ type: 'start_round' })
  }

  if (gameResult) {
    return (
      <div className="game-screen gathering">
        <div className="game-content">
          <h1>🎉 Game Over!</h1>
          <p>Winners: {gameResult.winners.join(', ')}</p>
          <div className="scores-list">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {gameResult.scores.map((score: any) => (
              <div key={score.userId} className="score-item">
                {score.displayName}: {score.points}
              </div>
            ))}
          </div>
          <p style={{ marginTop: '2rem', color: '#999' }}>Returning to dashboard...</p>
        </div>
      </div>
    )
  }

  if (gameStatus === 'gathering_categories') {
    return (
      <div className="game-screen gathering">
        <h2>Gathering categories...</h2>
        <div className="spinner"></div>
      </div>
    )
  }

  if (gameStatus === 'categories_ready') {
    return (
      <div className="game-screen">
        <div className="game-content">
          <h1>Category Overview</h1>
          <div className="categories-list">
            {categories.map((cat, idx) => (
              <div key={idx} className="category-item">
                {cat.name || cat.url}
              </div>
            ))}
          </div>
          <button className="primary-button" onClick={handleStartRound}>
            Start First Round
          </button>
        </div>
      </div>
    )
  }

  if (gameStatus === 'role_assignment' || countdown > 0) {
    return (
      <div className="game-screen">
        <div className="game-content">
          <h2>Preparing for round...</h2>
          <p className="role-display">
            {role === 'guesser'
              ? `You are the GUESSER`
              : `You are a CLUE-GIVER`}
          </p>
          <p className="guesser-info">Guesser: {guesser}</p>
          <div className="countdown">{countdown}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="game-screen">
      <div className="game-header">
        <h1>Round in Progress</h1>
        <div className="timer">{Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, '0')}</div>
      </div>

      <div className="game-content">
        {role === 'cluegiver' ? (
          <div className="cluegiver-view">
            <div className="word-display">{word || '...'}</div>
            <div className="guesses-display">
              <h3>Guesses:</h3>
              {guesses.length > 0 ? (
                guesses.map((guess, idx) => (
                  <div key={idx} className="guess-item">
                    {guess}
                  </div>
                ))
              ) : (
                <p>Waiting for guesses...</p>
              )}
            </div>
            <button className="primary-button" onClick={handleMarkCorrect}>
              Correct!
            </button>
          </div>
        ) : (
          <div className="guesser-view">
            {word && <div className="word-reveal">🎉 Correct! The word was: {word}</div>}
            <form onSubmit={handleSubmitGuess}>
              <input
                type="text"
                value={guessInput}
                onChange={(e) => setGuessInput(e.target.value)}
                placeholder="Enter your guess..."
                className="guess-input"
              />
              <button type="submit" className="primary-button">
                Submit Guess
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
