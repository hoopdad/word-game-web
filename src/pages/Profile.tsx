import { useEffect, useState, FormEvent, ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useDebounce } from '@/hooks/useCustomHooks'
import apiClient from '@/services/apiClient'
import { isDisplayNameValid } from '@/utils/validation'
import './Profile.css'

export const Profile = () => {
  const navigate = useNavigate()
  const { setTokenInApi } = useAuth()
  const [originalDisplayName] = useState(() => localStorage.getItem('displayName') ?? '')
  const [displayName, setDisplayName] = useState(originalDisplayName)
  const [isAvailable, setIsAvailable] = useState<boolean | null>(originalDisplayName ? true : null)
  const [checking, setChecking] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tokenReady, setTokenReady] = useState(false)
  const debouncedName = useDebounce(displayName, 300)

  useEffect(() => {
    const initToken = async () => {
      try {
        await setTokenInApi()
        setTokenReady(true)
      } catch {
        setError('Failed to initialize authentication')
      }
    }

    void initToken()
  }, [setTokenInApi])

  useEffect(() => {
    if (!tokenReady) return

    if (debouncedName === originalDisplayName && originalDisplayName) {
      setIsAvailable(true)
      setError(null)
      setChecking(false)
      return
    }

    if (!isDisplayNameValid(debouncedName)) {
      setIsAvailable(null)
      setChecking(false)
      return
    }

    const checkNameAvailability = async () => {
      setChecking(true)
      try {
        const available = await apiClient.checkNameAvailability(debouncedName)
        setIsAvailable(available)
        setError(null)
      } catch {
        setError('Failed to check name availability')
        setIsAvailable(null)
      } finally {
        setChecking(false)
      }
    }

    void checkNameAvailability()
  }, [debouncedName, tokenReady, originalDisplayName])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!isDisplayNameValid(displayName) || !isAvailable) {
      return
    }

    try {
      setSaving(true)
      setError(null)
      await apiClient.updateProfile(displayName)
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
        setError('Failed to update profile. Please try again.')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        <h1>Your Profile</h1>
        <p>
          Current display name: <strong>{originalDisplayName}</strong>
        </p>

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
              disabled={saving || !tokenReady}
              aria-describedby={isAvailable === false ? 'profile-name-error' : undefined}
            />
            {checking && <span className="loading">Checking...</span>}
            {isAvailable === true && <span className="available">✓ Available</span>}
            {isAvailable === false && (
              <span className="unavailable" id="profile-name-error">
                ✗ That name is taken
              </span>
            )}
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="action-buttons">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              disabled={saving}
              className="secondary-button"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!tokenReady || saving || !isDisplayNameValid(displayName) || !isAvailable}
              className="submit-button"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
