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
    evaluate(): Promise<void>
    stop(): Promise<void>
  }
  export const codemirrorSettings: { get: () => Record<string, unknown> }
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
}
