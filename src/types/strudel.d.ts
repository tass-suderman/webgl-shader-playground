declare module '@strudel/codemirror' {
  export interface StrudelMirrorOptions {
    root: HTMLElement
    initialCode?: string
    prebake: () => Promise<void>
    defaultOutput: unknown
    getTime: () => number
    transpiler: unknown
    solo?: boolean
    bgFill?: boolean
    onToggle?: (started: boolean) => void
    /** Called with the Error thrown when pattern evaluation fails */
    onEvalError?: (err: unknown) => void
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
  /** Register modules as globals so that Strudel pattern functions are available at eval time */
  export function evalScope(...modules: Promise<unknown>[]): Promise<unknown[]>
}

declare module '@strudel/mini' {
  // Pattern mini-notation parser – no additional types needed
}

declare module '@strudel/tonal' {
  // Tonal (music theory) helpers for Strudel – no additional types needed
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
  export function soundAlias(source: string, target: string): void
  export function registerSound(
    name: string,
    onTrigger: (time: number, value: Record<string, unknown>, onended: () => void) => { node: AudioNode; stop?: (releaseTime: number) => void; nodes?: Record<string, AudioNode[]> } | void,
    options?: { type?: string; prebake?: boolean },
  ): void
  export function getFrequencyFromValue(value: Record<string, unknown>, defaultMidi?: number): number
}
