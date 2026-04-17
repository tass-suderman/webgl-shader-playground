import { createContext, useCallback, useContext } from 'react'
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

export interface SavedContentStorageReturn {
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

const SavedContentContext = createContext<SavedContentStorageReturn | null>(null)

export const SavedContentProvider = ({children}: {children: React.ReactNode}) => {
  const [savedShaders, setSavedShaders] = useLocalStorage<SavedEntry[]>(SAVED_KEYS.savedShaders, [])
  const [savedPatterns, setSavedPatterns] = useLocalStorage<SavedEntry[]>(SAVED_KEYS.savedPatterns, [])

  const saveShader = useCallback((title: string, content: string) => {
    setSavedShaders(prev => [...prev.filter(e => e.title !== title), { title, content, savedAt: Date.now() }])
  }, [setSavedShaders])

  const savePattern = useCallback((title: string, content: string) => {
    setSavedPatterns(prev => [...prev.filter(e => e.title !== title), { title, content, savedAt: Date.now() }])
  }, [setSavedPatterns])

  const deleteShader = useCallback((title: string) => {
    setSavedShaders(prev => prev.filter(e => e.title !== title))
  }, [setSavedShaders])

  const deletePattern = useCallback((title: string) => {
    setSavedPatterns(prev => prev.filter(e => e.title !== title))
  }, [setSavedPatterns])

  const hasExistingShader = (title: string) => savedShaders.some(e => e.title === title)
  const hasExistingPattern = (title: string) => savedPatterns.some(e => e.title === title)

  const clearAll = useCallback(() => {
    setSavedShaders([])
    setSavedPatterns([])
  }, [setSavedShaders, setSavedPatterns])

  return (
		<SavedContentContext.Provider value={{
    savedShaders,
    savedPatterns,
    saveShader,
    savePattern,
    deleteShader,
    deletePattern,
    hasExistingShader,
    hasExistingPattern,
    clearAll,
		}}>
			{children}
		</SavedContentContext.Provider>
	)
}

export function useSavedContent(): SavedContentStorageReturn {
	const context = useContext(SavedContentContext)
	if (!context) {
		throw new Error('useSavedContent must be used within a SavedContentProvider')
	}
	return context
}
