import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWebSocket } from '@/context/WebSocketContext'
import { useAuth } from '@/hooks/useAuth'
import apiClient from '@/services/apiClient'
import './GameScreen.css'

type GameScreenStatus =
  | 'gathering_categories'
  | 'countdown'
  | 'category_overview'
  | 'round_active'
  | 'round_ended'
  | 'game_ended'

interface CategoryItem {
  name?: string
  url?: string
}

interface ScoreRow {
  key: string
  displayName: string
  points: number
}

interface GameResultPayload {
  winners?: unknown[]
  scores?: unknown[]
}

const normalizeGameStatus = (status: unknown): GameScreenStatus => {
  if (status === 'countdown' || status === 'round_active' || status === 'round_ended' || status === 'game_ended') {
    return status
  }
  if (status === 'category_overview' || status === 'categories_ready') {
    return 'category_overview'
  }
  return 'gathering_categories'
}

const formatWinnerName = (winner: unknown): string => {
  if (typeof winner === 'string') {
    return winner
  }
  if (winner && typeof winner === 'object') {
    const payload = winner as { display_name?: unknown }
    if (typeof payload.display_name === 'string') {
      return payload.display_name
    }
  }
  return ''
}

const formatScore = (score: unknown, index: number): ScoreRow | null => {
  if (!score || typeof score !== 'object') {
    return null
  }

  const payload = score as {
    display_name?: unknown
    displayName?: unknown
    user_id?: unknown
    total_points?: unknown
    points?: unknown
  }

  const displayName =
    (typeof payload.display_name === 'string' && payload.display_name) ||
    (typeof payload.displayName === 'string' && payload.displayName) ||
    (typeof payload.user_id === 'string' && payload.user_id)

  if (!displayName) {
    return null
  }

  const points =
    (typeof payload.total_points === 'number' && payload.total_points) ||
    (typeof payload.points === 'number' && payload.points) ||
    0

  return {
    key: `${displayName}-${index}`,
    displayName,
    points,
  }
}

export const GameScreen = () => {
  const navigate = useNavigate()
  const { send, on, off } = useWebSocket()
  const { setTokenInApi } = useAuth()
  const [isHydrating, setIsHydrating] = useState(true)
  const [gameStatus, setGameStatus] = useState<GameScreenStatus>('gathering_categories')
  const [role, setRole] = useState<'guesser' | 'cluegiver' | null>(null)
  const [word, setWord] = useState<string | null>(null)
  const [category, setCategory] = useState<string | null>(null)
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [guesses, setGuesses] = useState<string[]>([])
  const [guessInput, setGuessInput] = useState('')
  const [timeRemaining, setTimeRemaining] = useState(120)
  const [countdown, setCountdown] = useState(10)
  const [gameResult, setGameResult] = useState<GameResultPayload | null>(null)
  const userIdRef = useRef<string | null>(null)

  useEffect(() => {
    let mounted = true

    const hydrateGameStatus = async () => {
      try {
        await setTokenInApi()
        const data = await apiClient.getGameStatus()
        if (!mounted) return

        if (data.status === 'idle' || !data.game_id) {
          navigate('/dashboard', { replace: true })
          return
        }

        userIdRef.current = data.your_user_id
        setRole(data.your_role)
        setCategory(data.current_category)
        setGameStatus(normalizeGameStatus(data.status))
        setTimeRemaining(typeof data.round_remaining === 'number' ? data.round_remaining : 120)
        setCountdown(typeof data.countdown_remaining === 'number' ? data.countdown_remaining : 10)
      } catch (error) {
        if (mounted) {
          console.error('Failed to hydrate game status:', error)
          navigate('/dashboard', { replace: true })
        }
      } finally {
        if (mounted) {
          setIsHydrating(false)
        }
      }
    }

    hydrateGameStatus()

    return () => {
      mounted = false
    }
  }, [navigate, setTokenInApi])

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleConnected = (data: any) => {
      if (typeof data.user_id === 'string') {
        userIdRef.current = data.user_id
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleGameStatus = (data: any) => {
      if (typeof data.status === 'string') {
        setGameStatus(normalizeGameStatus(data.status))
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleCategoryOverview = (data: any) => {
      const incomingCategories = Array.isArray(data.categories) ? data.categories : []
      setCategories(incomingCategories)
      setGameStatus('category_overview')
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleRoundStarting = (data: any) => {
      const isGuesser = data.guesser_id === userIdRef.current
      setRole(isGuesser ? 'guesser' : 'cluegiver')
      setCategory(typeof data.category === 'string' ? data.category : null)
      setCountdown(typeof data.countdown_remaining === 'number' ? data.countdown_remaining : 10)
      setGameStatus('countdown')
      setWord(null)
      setGuesses([])
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleRoundStarted = (data: any) => {
      const isGuesser = data.guesser_id === userIdRef.current
      setRole(isGuesser ? 'guesser' : 'cluegiver')
      setCategory(typeof data.category === 'string' ? data.category : null)
      if (typeof data.round_remaining === 'number') {
        setTimeRemaining(data.round_remaining)
      }
      setGameStatus('round_active')
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleWordShown = (data: any) => {
      if (typeof data.word === 'string') {
        setWord(data.word)
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleGuessSubmitted = (data: any) => {
      const username = data.display_name || data.user || 'Unknown'
      if (typeof data.guess === 'string' && data.guess.length > 0) {
        setGuesses((prev) => [...prev, `${username}: ${data.guess}`])
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleScoreUpdated = (data: any) => {
      if (typeof data.word === 'string') {
        setWord(data.word)
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleTimer = (data: any) => {
      if (typeof data.remaining === 'number') {
        setTimeRemaining(data.remaining)
      }
      setGameStatus('round_active')
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleCountdown = (data: any) => {
      if (typeof data.countdown_remaining === 'number') {
        setCountdown(data.countdown_remaining)
      } else if (typeof data.remaining === 'number') {
        setCountdown(data.remaining)
      }
      setGameStatus('countdown')
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleRoundEnded = (data: any) => {
      if (typeof data.countdown_remaining === 'number') {
        setCountdown(data.countdown_remaining)
      }
      setGameStatus('round_ended')
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleGameEnd = (data: any) => {
      setGameResult(data)
      setGameStatus('game_ended')
    }

    on('connected', handleConnected)
    on('game_started', handleGameStatus)
    on('category_overview', handleCategoryOverview)
    on('round_starting', handleRoundStarting)
    on('round_started', handleRoundStarted)
    on('word_shown', handleWordShown)
    on('guess_submitted', handleGuessSubmitted)
    on('score_updated', handleScoreUpdated)
    on('timer_tick', handleTimer)
    on('countdown_tick', handleCountdown)
    on('round_ended', handleRoundEnded)
    on('game_ended', handleGameEnd)

    return () => {
      off('connected', handleConnected)
      off('game_started', handleGameStatus)
      off('category_overview', handleCategoryOverview)
      off('round_starting', handleRoundStarting)
      off('round_started', handleRoundStarted)
      off('word_shown', handleWordShown)
      off('guess_submitted', handleGuessSubmitted)
      off('score_updated', handleScoreUpdated)
      off('timer_tick', handleTimer)
      off('countdown_tick', handleCountdown)
      off('round_ended', handleRoundEnded)
      off('game_ended', handleGameEnd)
    }
  }, [on, off])

  useEffect(() => {
    if (!gameResult) return
    const redirectTimer = window.setTimeout(() => {
      navigate('/dashboard')
    }, 5000)

    return () => {
      window.clearTimeout(redirectTimer)
    }
  }, [gameResult, navigate])

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

  const roleLabel = role === null ? 'Assigning roles...' : role === 'guesser' ? 'You are the GUESSER' : 'You are a CLUE-GIVER'

  const winnerPayload = Array.isArray(gameResult?.winners) ? gameResult.winners : []
  const scorePayload = Array.isArray(gameResult?.scores) ? gameResult.scores : []
  const winners = winnerPayload.map(formatWinnerName).filter(Boolean)
  const scores = scorePayload
    .map((score: unknown, index: number) => formatScore(score, index))
    .filter((score: ScoreRow | null): score is ScoreRow => score !== null)

  if (gameResult) {
    return (
      <div className="game-screen gathering">
        <div className="game-content">
          <h1>🎉 Game Over!</h1>
          <p>Winners: {winners.length > 0 ? winners.join(', ') : 'No winners'}</p>
          <div className="scores-list">
            {scores.length > 0 ? (
              scores.map((score) => (
                <div key={score.key} className="score-item">
                  {score.displayName}: {score.points}
                </div>
              ))
            ) : (
              <div className="score-item">No scores available</div>
            )}
          </div>
          <p style={{ marginTop: '2rem', color: '#999' }}>Returning to dashboard...</p>
        </div>
      </div>
    )
  }

  if (isHydrating || gameStatus === 'gathering_categories') {
    return (
      <div className="game-screen gathering">
        <h2>Gathering categories...</h2>
        <div className="spinner"></div>
      </div>
    )
  }

  if (gameStatus === 'category_overview') {
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
          <p>Waiting for the next round to start...</p>
        </div>
      </div>
    )
  }

  if (gameStatus !== 'round_active') {
    return (
      <div className="game-screen">
        <div className="game-content">
          <h2>{gameStatus === 'round_ended' ? 'Round complete!' : 'Preparing for round...'}</h2>
          <div className="round-meta">
            <span className="role-badge">{roleLabel}</span>
            {category && <span className="category-badge">Category: {category}</span>}
          </div>
          {(gameStatus === 'countdown' || gameStatus === 'round_ended') && <div className="countdown">{countdown}</div>}
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
        <div className="round-meta">
          <span className="role-badge">{roleLabel}</span>
          {category && <span className="category-badge">Category: {category}</span>}
        </div>
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
