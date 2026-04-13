import { useCallback } from 'react'
import { useLocalStorage } from './useLocalStorage'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SavedEntry {
  title: string
  content: string
  savedAt: number
}

// ---------------------------------------------------------------------------
// Private key constants
// ---------------------------------------------------------------------------

const SAVED_KEYS = {
  savedShaders: 'shader-playground:saved-shaders',
  savedPatterns: 'shader-playground:saved-patterns',
} as const

// ---------------------------------------------------------------------------
// Imperative helpers (used where React state updates would be too slow)
// ---------------------------------------------------------------------------

export function getSavedShaders(): SavedEntry[] {
  try {
    const raw = localStorage.getItem(SAVED_KEYS.savedShaders)
    if (!raw) return []
    return JSON.parse(raw) as SavedEntry[]
  } catch { return [] }
}

export function getSavedPatterns(): SavedEntry[] {
  try {
    const raw = localStorage.getItem(SAVED_KEYS.savedPatterns)
    if (!raw) return []
    return JSON.parse(raw) as SavedEntry[]
  } catch { return [] }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface SavedContentStorage {
  savedShaders: SavedEntry[]
  savedPatterns: SavedEntry[]
  saveShader: (title: string, content: string) => void
  savePattern: (title: string, content: string) => void
  deleteShader: (title: string) => void
  deletePattern: (title: string) => void
  hasExistingShader: (title: string) => boolean
  hasExistingPattern: (title: string) => boolean
  clearAll: () => void
}

export function useSavedContent(): SavedContentStorage {
  const [savedShaders, setSavedShaders] = useLocalStorage<SavedEntry[]>(SAVED_KEYS.savedShaders, [])
  const [savedPatterns, setSavedPatterns] = useLocalStorage<SavedEntry[]>(SAVED_KEYS.savedPatterns, [])

  const saveShader = useCallback((title: string, content: string) => {
    const filtered = savedShaders.filter(e => e.title !== title)
    setSavedShaders([...filtered, { title, content, savedAt: Date.now() }])
  }, [savedShaders, setSavedShaders])

  const savePattern = useCallback((title: string, content: string) => {
    const filtered = savedPatterns.filter(e => e.title !== title)
    setSavedPatterns([...filtered, { title, content, savedAt: Date.now() }])
  }, [savedPatterns, setSavedPatterns])

  const deleteShader = useCallback((title: string) => {
    setSavedShaders(savedShaders.filter(e => e.title !== title))
  }, [savedShaders, setSavedShaders])

  const deletePattern = useCallback((title: string) => {
    setSavedPatterns(savedPatterns.filter(e => e.title !== title))
  }, [savedPatterns, setSavedPatterns])

  const hasExistingShader = useCallback((title: string) => {
    return savedShaders.some(e => e.title === title)
  }, [savedShaders])

  const hasExistingPattern = useCallback((title: string) => {
    return savedPatterns.some(e => e.title === title)
  }, [savedPatterns])

  const clearAll = useCallback(() => {
    setSavedShaders([])
    setSavedPatterns([])
  }, [setSavedShaders, setSavedPatterns])

  return {
    savedShaders,
    savedPatterns,
    saveShader,
    savePattern,
    deleteShader,
    deletePattern,
    hasExistingShader,
    hasExistingPattern,
    clearAll,
  }
}
