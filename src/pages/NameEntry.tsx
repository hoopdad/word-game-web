import { useState, useEffect, FormEvent, ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useDebounce } from '@/hooks/useCustomHooks'
import apiClient from '@/services/apiClient'
import { isDisplayNameValid } from '@/utils/validation'
import './NameEntry.css'

export const NameEntry = () => {
  const navigate = useNavigate()
  const { account, setTokenInApi } = useAuth()
  const [displayName, setDisplayName] = useState('')
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tokenReady, setTokenReady] = useState(false)
  const debouncedName = useDebounce(displayName, 300)
  const isDisplayNameFormatValid = isDisplayNameValid(displayName)
  const showFormatHint = displayName.length > 0 && !isDisplayNameFormatValid
  const nameInputDescriptionId = showFormatHint
    ? 'name-format-hint'
    : isAvailable === false
      ? 'name-error'
      : undefined

  // Initialize token on mount
  useEffect(() => {
    const initToken = async () => {
      try {
        await setTokenInApi()
        setTokenReady(true)
      } catch (err) {
        setError('Failed to initialize authentication')
      }
    }
    initToken()
  }, [setTokenInApi])

  useEffect(() => {
    // Only check name availability after token is ready
    if (!tokenReady) return

    if (debouncedName.length === 0) {
      setIsAvailable(null)
      return
    }

    if (isDisplayNameValid(debouncedName)) {
      checkNameAvailability(debouncedName)
    } else {
      setIsAvailable(null)
    }
  }, [debouncedName, tokenReady])

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
    if (!isDisplayNameFormatValid || !isAvailable) {
      return
    }

    try {
      setLoading(true)
      setError(null)
      await apiClient.registerUser(displayName)
      localStorage.setItem('displayName', displayName)
      navigate('/dashboard')
    } catch (err: unknown) {
      const error = err as { response?: { status?: number; data?: { detail?: string } } }
      if (error.response?.status === 409) {
        setError('That name is taken')
      } else if (error.response?.status === 422) {
        setError(
          error.response.data?.detail ?? 'Display name must be 2-20 letters, numbers, and spaces.',
        )
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
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
               setDisplayName(e.target.value)
               setError(null)
              }}
              placeholder="2-20 characters"
              maxLength={20}
              minLength={2}
              disabled={loading || !tokenReady}
              aria-describedby={nameInputDescriptionId}
              aria-invalid={showFormatHint}
            />
            {showFormatHint && (
              <span className="validation-hint" id="name-format-hint">
               2-20 letters, numbers, and spaces
              </span>
            )}
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
            disabled={!isAvailable || loading || !isDisplayNameFormatValid}
            className="submit-button"
          >
            {loading ? 'Setting up...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  )
}
