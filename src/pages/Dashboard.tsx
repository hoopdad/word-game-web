import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWebSocket } from '@/context/WebSocketContext'
import { useAuth } from '@/hooks/useAuth'
import apiClient from '@/services/apiClient'
import './Dashboard.css'

export const Dashboard = () => {
  const navigate = useNavigate()
  const { send, on, off } = useWebSocket()
  const { logout, setTokenInApi } = useAuth()
  const [activeUsers, setActiveUsers] = useState<string[]>([])
  const [gameCount, setGameCount] = useState(0)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [allTimeLeaderboard, setAllTimeLeaderboard] = useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [todayLeaderboard, setTodayLeaderboard] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [lastGameResult, setLastGameResult] = useState<any | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Ensure token is set before making API calls
        await setTokenInApi()

        const [gameCountData, allTimeData, todayData, activeData] = await Promise.all([
          apiClient.getGameCount(),
          apiClient.getAllTimeLeaderboard(),
          apiClient.getTodayLeaderboard(),
          apiClient.getActiveUsers(),
        ])
        setGameCount(gameCountData)
        setAllTimeLeaderboard(allTimeData)
        setTodayLeaderboard(todayData)
        setActiveUsers(activeData)
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Subscribe to WebSocket events
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleUserJoined = (data: any) => {
      setActiveUsers((prev) => {
        const newUsers = [...prev, data.user]
        return [...new Set(newUsers)]
      })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleUserLeft = (data: any) => {
      setActiveUsers((prev) => prev.filter((user) => user !== data.user))
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleGameEnded = (data: any) => {
      setLastGameResult(data)
      // Auto-clear celebration after 5 seconds
      setTimeout(() => setLastGameResult(null), 5000)
    }

    on('user_joined', handleUserJoined)
    on('user_left', handleUserLeft)
    on('game_ended', handleGameEnded)

    return () => {
      off('user_joined', handleUserJoined)
      off('user_left', handleUserLeft)
      off('game_ended', handleGameEnded)
    }
  }, [on, off, setTokenInApi])

  const handleStartGame = () => {
    send({ type: 'start_game' })
    navigate('/game')
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Dashboard</h1>
        <div className="dashboard-actions">
          <button className="nav-button" onClick={() => navigate('/categories')}>
            Configure Categories
          </button>
          <button className="logout-button" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      {lastGameResult && (
        <div className="post-game-status">
          🎉 Congratulations to {lastGameResult.winners.join(', ')}! 🎉
        </div>
      )}

      <main className="dashboard-main">
        {loading ? (
          <div className="loading">Loading dashboard...</div>
        ) : (
          <>
            <section className="cards-grid">
              <div className="card active-users-card">
                <h2>Active Users</h2>
                <div className="users-list">
                  {activeUsers.length > 0 ? (
                    activeUsers.map((user) => (
                      <div key={user} className="user-item">
                        🟢 {user}
                      </div>
                    ))
                  ) : (
                    <p>No users currently online</p>
                  )}
                </div>
              </div>

              <div className="card game-count-card">
                <h2>Games Played</h2>
                <div className="big-number">{gameCount}</div>
                <p>total games across all players</p>
              </div>

              <div className="card top-all-time-card">
                <h2>All-Time Top 10</h2>
                <ol className="leaderboard">
                  {allTimeLeaderboard.slice(0, 10).map((entry, idx) => (
                    <li key={entry.userId}>
                      <span className="rank">{idx + 1}.</span>
                      <span className="name">{entry.displayName}</span>
                      <span className="points">{entry.points}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="card top-today-card">
                <h2>Today&apos;s Top 3</h2>
                <ol className="leaderboard">
                  {todayLeaderboard.slice(0, 3).map((entry, idx) => (
                    <li key={entry.userId}>
                      <span className="rank">{idx + 1}.</span>
                      <span className="name">{entry.displayName}</span>
                      <span className="points">{entry.points}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </section>

            <section className="game-controls">
              <button className="start-game-button" onClick={handleStartGame}>
                Start Game
              </button>
            </section>
          </>
        )}
      </main>
    </div>
  )
}
