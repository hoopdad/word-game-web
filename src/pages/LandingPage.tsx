import { useAuth } from '@/hooks/useAuth'
import { useLocalStorage } from '@/hooks/useCustomHooks'
import './LandingPage.css'

export const LandingPage = () => {
  const { login, isAuthenticated } = useAuth()
  const [darkMode, setDarkMode] = useLocalStorage('darkMode', false)

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    if (!darkMode) {
      document.documentElement.classList.add('dark-mode')
    } else {
      document.documentElement.classList.remove('dark-mode')
    }
  }

  if (isAuthenticated) {
    return null
  }

  return (
    <div className={`landing-page ${darkMode ? 'dark' : 'light'}`}>
      <header className="landing-header">
        <div className="landing-nav">
          <h1 className="app-title">Word Game</h1>
          <button
            className="theme-toggle"
            onClick={toggleDarkMode}
            aria-label="Toggle dark mode"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <main className="landing-main">
        <section className="hero">
          <h2>Welcome to Word Game</h2>
          <p>
            Experience the thrill of real-time multiplayer word guessing. Challenge your friends,
            test your vocabulary, and climb the leaderboard!
          </p>

          <button className="cta-button" onClick={login}>
            Log In / Sign Up
          </button>
        </section>

        <section className="features">
          <div className="feature-card">
            <h3>🎮 Real-Time Gameplay</h3>
            <p>Play live with friends using WebSocket technology for instant updates.</p>
          </div>
          <div className="feature-card">
            <h3>🏆 Leaderboards</h3>
            <p>Track your performance across daily and all-time rankings.</p>
          </div>
          <div className="feature-card">
            <h3>📚 Custom Categories</h3>
            <p>Add your own word categories to make the game your own.</p>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <p>&copy; 2024 Word Game. All rights reserved.</p>
      </footer>
    </div>
  )
}
