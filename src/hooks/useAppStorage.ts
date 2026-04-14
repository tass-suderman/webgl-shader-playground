import { useLocalStorage } from './useLocalStorage'
import { DEFAULT_SHADER } from '../shaders/default'
import { DEFAULT_BUFFER3_SHADER, DEFAULT_BUFFER4_SHADER, DEFAULT_BUFFER6_SHADER } from '../shaders/buffers'

// ---------------------------------------------------------------------------
// Private key constants – no other file should reference these strings
// ---------------------------------------------------------------------------

const KEYS = {
  glslCode: 'shader-playground:glsl-code',
  glslTitle: 'shader-playground:glsl-title',
  strudelCode: 'shader-playground:strudel-code',
  strudelTitle: 'shader-playground:strudel-title',
  buffer3Code: 'shader-playground:buffer3-code',
  buffer4Code: 'shader-playground:buffer4-code',
  buffer6Code: 'shader-playground:buffer6-code',
  theme: 'shader-playground:theme',
  vimMode: 'shader-playground:vim-mode',
  volume: 'shader-playground:volume',
  muted: 'shader-playground:muted',
  immersiveOpacity: 'shader-playground:immersive-opacity',
  fontSize: 'shader-playground:font-size',
  warnOnOverwrite: 'shader-playground:warn-on-overwrite',
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

export function saveBuffer3Code(code: string): void {
  try { localStorage.setItem(KEYS.buffer3Code, code) } catch { /* quota exceeded */ }
}

export function saveBuffer4Code(code: string): void {
  try { localStorage.setItem(KEYS.buffer4Code, code) } catch { /* quota exceeded */ }
}

export function saveBuffer6Code(code: string): void {
  try { localStorage.setItem(KEYS.buffer6Code, code) } catch { /* quota exceeded */ }
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

export function getInitialBuffer3Code(): string {
  return localStorage.getItem(KEYS.buffer3Code) ?? DEFAULT_BUFFER3_SHADER
}

export function getInitialBuffer4Code(): string {
  return localStorage.getItem(KEYS.buffer4Code) ?? DEFAULT_BUFFER4_SHADER
}

export function getInitialBuffer6Code(): string {
  return localStorage.getItem(KEYS.buffer6Code) ?? DEFAULT_BUFFER6_SHADER
}

export function getInitialTheme(): string {
  return localStorage.getItem(KEYS.theme) ?? 'kanagawa'
}

// ---------------------------------------------------------------------------
// Reactive hook for all persisted settings
// ---------------------------------------------------------------------------

export interface AppStorage {
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
}

export function useAppStorage(): AppStorage {
  const [theme, setTheme] = useLocalStorage(KEYS.theme, 'kanagawa')
  const [vimMode, setVimMode] = useLocalStorage(KEYS.vimMode, false)
  const [volume, setVolume] = useLocalStorage(KEYS.volume, 50)
  const [muted, setMuted] = useLocalStorage(KEYS.muted, false)
  const [immersiveOpacity, setImmersiveOpacity] = useLocalStorage(KEYS.immersiveOpacity, 50)
  const [fontSize, setFontSize] = useLocalStorage(KEYS.fontSize, 13)
  const [warnOnOverwrite, setWarnOnOverwrite] = useLocalStorage(KEYS.warnOnOverwrite, true)

  return {
    theme, setTheme,
    vimMode, setVimMode,
    volume, setVolume,
    muted, setMuted,
    immersiveOpacity, setImmersiveOpacity,
    fontSize, setFontSize,
    warnOnOverwrite, setWarnOnOverwrite,
  }
}
