import { useState, useEffect, FormEvent, ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useDebounce } from '@/hooks/useCustomHooks'
import apiClient from '@/services/apiClient'
import './NameEntry.css'

export const NameEntry = () => {
  const navigate = useNavigate()
  const { account } = useAuth()
  const [displayName, setDisplayName] = useState('')
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const debouncedName = useDebounce(displayName, 300)

  useEffect(() => {
    if (debouncedName.length >= 2 && debouncedName.length <= 20) {
      checkNameAvailability(debouncedName)
    } else if (debouncedName.length < 2) {
      setIsAvailable(null)
    }
  }, [debouncedName])

  const checkNameAvailability = async (name: string) => {
    setLoading(true)
    try {
      const available = await apiClient.checkNameAvailability(name)
      setIsAvailable(available)
      setError(null)
    } catch (err) {
      setError('Failed to check name availability')
      setIsAvailable(null)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!isAvailable || displayName.length < 2 || displayName.length > 20) {
      return
    }

    try {
      setLoading(true)
      await apiClient.registerUser(displayName)
      localStorage.setItem('displayName', displayName)
      navigate('/dashboard')
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = err as any
      if (error.response?.status === 409) {
        setError('That name is taken')
      } else {
        setError('Failed to register. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="name-entry-container">
      <div className="name-entry-card">
        <h1>Choose Your Display Name</h1>
        <p>Welcome {account?.name}! Please choose how you&apos;d like to appear in the game.</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="displayName">Display Name</label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setDisplayName(e.target.value)}
              placeholder="2-20 characters"
              maxLength={20}
              minLength={2}
              disabled={loading}
              aria-describedby={isAvailable === false ? 'name-error' : undefined}
            />
            {loading && <span className="loading">Checking...</span>}
            {isAvailable === true && <span className="available">✓ Available</span>}
            {isAvailable === false && (
              <span className="unavailable" id="name-error">
                ✗ That name is taken
              </span>
            )}
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            type="submit"
            disabled={!isAvailable || loading || displayName.length < 2}
            className="submit-button"
          >
            {loading ? 'Setting up...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  )
}
