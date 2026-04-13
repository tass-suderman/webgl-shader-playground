import { useState, useCallback } from 'react'

/**
 * A hook that syncs a state value with localStorage.
 *
 * Reading and writing work like useState — just call the setter with a new
 * value and it will be persisted automatically.
 *
 * Existing values stored by the app before this hook was introduced are read
 * back correctly: plain strings (e.g. `'kanagawa'`) fall back to a raw-string
 * parse when JSON.parse fails, booleans stored as `'true'`/`'false'` parse as
 * JSON booleans, and numbers stored as numeric strings parse as JSON numbers.
 */
export function useLocalStorage<T>(key: string, defaultValue: T): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key)
      if (item === null) return defaultValue
      try {
        return JSON.parse(item) as T
      } catch {
        // Stored as a plain (non-JSON-encoded) string — return as-is
        return item as unknown as T
      }
    } catch {
      return defaultValue
    }
  })

  const setStoredValue = useCallback(
    (newValue: T) => {
      setValue(newValue)
      try {
        localStorage.setItem(key, JSON.stringify(newValue))
      } catch {
        // Ignore storage errors (e.g. private browsing quota exceeded)
      }
    },
    [key],
  )

  return [value, setStoredValue]
}
