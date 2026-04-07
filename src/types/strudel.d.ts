declare module '@strudel/draw'
declare module '@strudel/mini'
declare module '@strudel/tonal'
declare module '@strudel/hydra'
declare module '@strudel/soundfonts' {
  export function registerSoundfonts(): void
}
declare module '@strudel/midi'

declare module '@strudel/codemirror' {
  export interface StrudelMirrorOptions {
    root: HTMLElement
    initialCode?: string
    prebake: () => Promise<void>
    defaultOutput: unknown
    getTime: () => number
    transpiler: unknown
    solo?: boolean
    onToggle?: (started: boolean) => void
  }
  export class StrudelMirror {
    constructor(options: StrudelMirrorOptions)
    /** Current code string – updated on every keystroke */
    code: string
    /** Underlying CodeMirror EditorView */
    editor: {
      state: { doc: { toString(): string; length: number } }
      dispatch(tr: { changes?: { from: number; to?: number; insert?: string } }): void
      /** Remove the editor DOM from its parent and clean up state */
      destroy(): void
    }
    evaluate(): Promise<void>
    stop(): Promise<void>
    /** Remove document-level event listeners added by this mirror */
    clear(): void
    /** Replace the full editor content with the given string */
    setCode(code: string): void
  }
  export const codemirrorSettings: { get: () => Record<string, unknown> }
}

declare module '@strudel/core' {
  export function evalScope(...args: unknown[]): Promise<void>
  export const Pattern: {
    prototype: { piano: () => unknown }
  }
}

declare module '@strudel/repl' {
  export function prebake(): Promise<void>
}

declare module '@strudel/transpiler' {
  const transpiler: unknown
  export { transpiler }
}

declare module '@strudel/webaudio' {
  export const webaudioOutput: unknown
  export function getAudioContext(): AudioContext
  export function initAudioOnFirstClick(): void
  export function getSuperdoughAudioController(): {
    output: { destinationGain: GainNode }
  } | null
  export function registerSynthSounds(): void
  export function registerZZFXSounds(): void
  export function samples(sampleMap: string | object, baseUrl?: string, options?: object): Promise<void>
  export function aliasBank(arg: string | object, ...rest: unknown[]): Promise<void>
}
