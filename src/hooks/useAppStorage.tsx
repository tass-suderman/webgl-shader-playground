import { useLocalStorage } from './useLocalStorage'
import { DEFAULT_SHADER } from '../utility/shader/defaultShader'
import { createContext, useContext } from 'react'

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface UserSample {
  id: string
  title: string
  fileName: string
  /** Base64-encoded audio file data */
  audioData: string
}

// ---------------------------------------------------------------------------
// Private key constants – no other file should reference these strings
// ---------------------------------------------------------------------------

const KEYS = {
  glslCode: 'shader-playground:glsl-code',
  glslTitle: 'shader-playground:glsl-title',
  strudelCode: 'shader-playground:strudel-code',
  strudelTitle: 'shader-playground:strudel-title',
  theme: 'shader-playground:theme',
  vimMode: 'shader-playground:vim-mode',
  volume: 'shader-playground:volume',
  muted: 'shader-playground:muted',
  immersiveOpacity: 'shader-playground:immersive-opacity',
  fontSize: 'shader-playground:font-size',
  warnOnOverwrite: 'shader-playground:warn-on-overwrite',
  warnOnLoadExample: 'shader-playground:warn-on-load-example',
  warnOnLoadSaved: 'shader-playground:warn-on-load-saved',
  strudelAutocomplete: 'shader-playground:strudel-autocomplete',
  glslAutocomplete: 'shader-playground:glsl-autocomplete',
  userSamples: 'shader-playground:user-samples',
} as const

// ---------------------------------------------------------------------------
// Imperative save helpers (used where React state updates would be too slow,
// e.g. Monaco's onChange or CodeMirror handlers)
// ---------------------------------------------------------------------------

export function saveGlslCode(code: string): void {
  try { localStorage.setItem(KEYS.glslCode, code) } catch { /* quota exceeded */ }
}

export function saveGlslTitle(title: string): void {
  try { localStorage.setItem(KEYS.glslTitle, title) } catch { /* quota exceeded */ }
}

export function saveStrudelCode(code: string): void {
  try { localStorage.setItem(KEYS.strudelCode, code) } catch { /* quota exceeded */ }
}

export function saveStrudelTitle(title: string): void {
  try { localStorage.setItem(KEYS.strudelTitle, title) } catch { /* quota exceeded */ }
}

export function getUserSamples(): UserSample[] {
  try {
    const raw = localStorage.getItem(KEYS.userSamples)
    if (!raw) return []
    return JSON.parse(raw) as UserSample[]
  } catch {
    return []
  }
}

export function saveUserSamples(samples: UserSample[]): void {
  try { localStorage.setItem(KEYS.userSamples, JSON.stringify(samples)) } catch { /* quota exceeded */ }
}

// ---------------------------------------------------------------------------
// Read-once helpers (for values needed before React state is initialised)
// ---------------------------------------------------------------------------

export function getInitialGlslCode(): string {
  return localStorage.getItem(KEYS.glslCode) ?? DEFAULT_SHADER
}

export function getInitialGlslTitle(defaultTitle: string): string {
  return localStorage.getItem(KEYS.glslTitle) ?? defaultTitle
}

export function getInitialStrudelCode(defaultCode: string): string {
  return localStorage.getItem(KEYS.strudelCode) ?? defaultCode
}

export function getInitialStrudelTitle(defaultTitle: string): string {
  return localStorage.getItem(KEYS.strudelTitle) ?? defaultTitle
}

export function getInitialTheme(): string {
  return localStorage.getItem(KEYS.theme) ?? 'kanagawa'
}

// ---------------------------------------------------------------------------
// Reactive hook for all persisted settings
// ---------------------------------------------------------------------------

export interface AppStorageReturn {
  theme: string
  setTheme: (v: string) => void
  vimMode: boolean
  setVimMode: (v: boolean) => void
  volume: number
  setVolume: (v: number) => void
  muted: boolean
  setMuted: (v: boolean) => void
  immersiveOpacity: number
  setImmersiveOpacity: (v: number) => void
  fontSize: number
  setFontSize: (v: number) => void
  warnOnOverwrite: boolean
  setWarnOnOverwrite: (v: boolean) => void
  warnOnLoadExample: boolean
  setWarnOnLoadExample: (v: boolean) => void
  warnOnLoadSaved: boolean
  setWarnOnLoadSaved: (v: boolean) => void
  strudelAutocomplete: boolean
  setStrudelAutocomplete: (v: boolean) => void
  glslAutocomplete: boolean
  setGlslAutocomplete: (v: boolean) => void
  userSamples: UserSample[]
  setUserSamples: (v: UserSample[] | ((prev: UserSample[]) => UserSample[])) => void
}

const AppStorageContext = createContext<AppStorageReturn | null>(null)


export const AppStorageProvider = ({children}: {children: React.ReactNode}) => {
  const [theme, setTheme] = useLocalStorage(KEYS.theme, 'kanagawa')
  const [vimMode, setVimMode] = useLocalStorage(KEYS.vimMode, false)
  const [volume, setVolume] = useLocalStorage(KEYS.volume, 50)
  const [muted, setMuted] = useLocalStorage(KEYS.muted, false)
  const [immersiveOpacity, setImmersiveOpacity] = useLocalStorage(KEYS.immersiveOpacity, 50)
  const [fontSize, setFontSize] = useLocalStorage(KEYS.fontSize, 13)
  const [warnOnOverwrite, setWarnOnOverwrite] = useLocalStorage(KEYS.warnOnOverwrite, true)
  const [warnOnLoadExample, setWarnOnLoadExample] = useLocalStorage(KEYS.warnOnLoadExample, true)
  const [warnOnLoadSaved, setWarnOnLoadSaved] = useLocalStorage(KEYS.warnOnLoadSaved, true)
  const [strudelAutocomplete, setStrudelAutocomplete] = useLocalStorage(KEYS.strudelAutocomplete, true)
  const [glslAutocomplete, setGlslAutocomplete] = useLocalStorage(KEYS.glslAutocomplete, true)
  const [userSamples, setUserSamples] = useLocalStorage<UserSample[]>(KEYS.userSamples, [])

  return (
		<AppStorageContext.Provider value={{
			theme, setTheme,
			vimMode, setVimMode,
			volume, setVolume,
			muted, setMuted,
			immersiveOpacity, setImmersiveOpacity,
			fontSize, setFontSize,
			warnOnOverwrite, setWarnOnOverwrite,
			warnOnLoadExample, setWarnOnLoadExample,
			warnOnLoadSaved, setWarnOnLoadSaved,
			strudelAutocomplete, setStrudelAutocomplete,
			glslAutocomplete, setGlslAutocomplete,
			userSamples, setUserSamples,
		}}>
			{children}
		</AppStorageContext.Provider>
	)
}

export const useAppStorage = () => {
	const context = useContext(AppStorageContext)
	if (!context) {
		throw new Error('useAppStorage must be used within an AppStorageProvider')
	}
	return context
}
