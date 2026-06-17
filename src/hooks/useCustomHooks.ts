import { useState, useCallback, useEffect } from 'react'

export const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}

export const useAsync = <T, E = string>(
  asyncFunction: () => Promise<T>,
  immediate = true,
) => {
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle')
  const [value, setValue] = useState<T | null>(null)
  const [error, setError] = useState<E | null>(null)

  const execute = useCallback(async () => {
    setStatus('pending')
    setValue(null)
    setError(null)

    try {
      const response = await asyncFunction()
      setValue(response)
      setStatus('success')
      return response
    } catch (error) {
      setError(error as E)
      setStatus('error')
    }
  }, [asyncFunction])

  useEffect(() => {
    if (immediate) {
      execute()
    }
  }, [execute, immediate])

  return { execute, status, value, error }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useLocalStorage = (key: string, initialValue: any) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.log(error)
      return initialValue
    }
  })

  const setValue = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (value: any) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value
        setStoredValue(valueToStore)
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore))
        }
      } catch (error) {
        console.log(error)
      }
    },
    [key, storedValue],
  )

  return [storedValue, setValue]
}

// Utility functions for game logic
export const validateDisplayName = (name: string): boolean => {
  if (!name || name.length < 2 || name.length > 20) {
    return false
  }
  // Allow letters, numbers, hyphens, underscores; no spaces or special chars
  return /^[a-zA-Z0-9_-]+$/.test(name)
}

export const calculateRoundScore = (secondsElapsed: number, isCorrect: boolean): number => {
  if (!isCorrect) {
    return 0
  }
  // Points decrease with time: max 200 points at 0 seconds, min 10 points at 120 seconds
  const basePoints = Math.max(10, 200 - secondsElapsed * 1.5)
  return Math.floor(basePoints)
}

export const getScoreMultiplier = (roundNumber: number): number => {
  // Multiplier increases slightly each round: 1.0x for round 1, 1.1x for round 2, etc.
  return 1 + (roundNumber - 1) * 0.1
}
