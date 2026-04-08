import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import { StrudelMirror } from '@strudel/codemirror'
import { prebake } from '@strudel/repl'
import { webaudioOutput, getAudioContext, initAudioOnFirstClick, getSuperdoughAudioController, registerSynthSounds, registerZZFXSounds, soundAlias } from '@strudel/webaudio'
import { transpiler } from '@strudel/transpiler'
import ShaderHeader from './ShaderHeader'
import SoundsModal from './strudel/SoundsModal'
// @strudel/codemirror ships no TypeScript declarations; augment the methods we use
type StrudelMirrorExt = StrudelMirror & {
  changeSetting: (key: string, value: unknown) => void
  setTheme: (name: string) => void
}

// Minimal prebake: first registers built-in oscillator sounds synchronously
// (sawtooth, sine, square, triangle, etc.), then runs the full prebake which
// loads evalScope globals and optional remote sample banks.  Any failure in
// remote sample loading is caught so the prebake promise never rejects –
// built-in oscillators will always work, even offline.
const minimalPrebake = async (): Promise<void> => {
  registerSynthSounds()
  registerZZFXSounds()
  // Register 'bd' as a fallback alias for 'sbd' (synth bass drum) so patterns
  // using the common 'bd' name work even when remote sample banks fail to load.
  // If prebake() succeeds and loads real 'bd' samples they will take precedence.
  soundAlias('sbd', 'bd')
  try {
    await prebake()
  } catch {
    console.warn('[strudel] Remote sample loading failed – only built-in oscillator sounds are available.')
  }
}

const DEFAULT_STRUDEL_CODE = `// Strudel live-coding pattern
// Alt+Enter to play, Alt+. to pause
note("c3 [e3 g3] b3 [g3 e3]").sound("sawtooth").lpf(800).lpenv(2).slow(2)`

const DEFAULT_STRUDEL_TITLE = 'Strudel Pattern'

const LS_STRUDEL_CODE = 'shader-playground:strudel-code'
const LS_STRUDEL_TITLE = 'shader-playground:strudel-title'

// Map app theme names to CodeMirror / Strudel editor themes
function mapToStrudelTheme(themeName: string): string {
  if (themeName === 'kanagawa') return 'tokyoNight'
  return 'vscodeDark'
}

export interface StrudelPaneHandle {
  play: () => void
  pause: () => void
  loadExample: (title: string, content: string) => void
}

interface StrudelPaneProps {
  onAnalyserReady: (analyser: AnalyserNode | null) => void
  onAudioStreamReady?: (stream: MediaStream | null) => void
  vimMode?: boolean
  themeName?: string
}

const StrudelPane = forwardRef<StrudelPaneHandle, StrudelPaneProps>(function StrudelPane(
  { onAnalyserReady, onAudioStreamReady, vimMode = false, themeName = 'kanagawa' },
  ref,
) {
  const rootRef = useRef<HTMLDivElement>(null)
  const mirrorRef = useRef<StrudelMirrorExt | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const destinationNodeRef = useRef<MediaStreamAudioDestinationNode | null>(null)
  /** Reference to the GainNode we connected our analyser/destination to, so we can remove those connections cleanly on stop */
  const destinationGainRef = useRef<GainNode | null>(null)
  const isPlayingRef = useRef(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  // Capture the saved code once at mount – used as StrudelMirror's initialCode
  const savedStrudelCode = useRef(localStorage.getItem(LS_STRUDEL_CODE) ?? DEFAULT_STRUDEL_CODE)
  const [isPlaying, setIsPlaying] = useState(false)
  const [strudelTitle, setStrudelTitle] = useState(
    () => localStorage.getItem(LS_STRUDEL_TITLE) ?? DEFAULT_STRUDEL_TITLE,
  )
  const [soundsOpen, setSoundsOpen] = useState(false)
  const onAnalyserReadyRef = useRef(onAnalyserReady)
  onAnalyserReadyRef.current = onAnalyserReady
  const onAudioStreamReadyRef = useRef(onAudioStreamReady)
  onAudioStreamReadyRef.current = onAudioStreamReady
  // Keep latest props in refs so the mount effect can read them without re-running
  const vimModeRef = useRef(vimMode)
  vimModeRef.current = vimMode
  const themeNameRef = useRef(themeName)
  themeNameRef.current = themeName

  useImperativeHandle(ref, () => ({
    play() {
      mirrorRef.current?.evaluate().catch(console.error)
    },
    pause() {
      mirrorRef.current?.stop().catch(console.error)
    },
    loadExample(title: string, content: string) {
      if (mirrorRef.current) {
        mirrorRef.current.setCode(content)
        mirrorRef.current.evaluate().catch(console.error)
      }
      localStorage.setItem(LS_STRUDEL_CODE, content)
      setStrudelTitle(title)
      localStorage.setItem(LS_STRUDEL_TITLE, title)
    },
  }), [])

  useEffect(() => {
    if (!rootRef.current) return
    initAudioOnFirstClick()
    const mirror = new StrudelMirror({
      root: rootRef.current,
      initialCode: savedStrudelCode.current,
      prebake: minimalPrebake,
      defaultOutput: webaudioOutput,
      getTime: () => getAudioContext()?.currentTime ?? 0,
      transpiler,
      solo: false,
      onToggle: (started: boolean) => {
        isPlayingRef.current = started
        setIsPlaying(started)
        if (started && !analyserRef.current) {
          const ctx = getAudioContext()
          const controller = getSuperdoughAudioController()
          // Resume suspended audio context (browser autoplay policy)
          if (ctx?.state === 'suspended') {
            ctx.resume().catch(console.error)
          }
          if (ctx && controller?.output?.destinationGain) {
            const dg = controller.output.destinationGain
            destinationGainRef.current = dg

            const analyser = ctx.createAnalyser()
            analyser.fftSize = 256
            dg.connect(analyser)
            analyserRef.current = analyser
            onAnalyserReadyRef.current(analyser)

            // Create a MediaStream destination so the audio can be captured for recording
            const destination = ctx.createMediaStreamDestination()
            dg.connect(destination)
            destinationNodeRef.current = destination
            onAudioStreamReadyRef.current?.(destination.stream)
          }
        }
        if (!started && analyserRef.current) {
          // Remove the specific connections we added to destinationGain
          const dg = destinationGainRef.current
          if (dg) {
            try { dg.disconnect(analyserRef.current) } catch { /* node may have been reset */ }
            if (destinationNodeRef.current) {
              try { dg.disconnect(destinationNodeRef.current) } catch { /* node may have been reset */ }
            }
            destinationGainRef.current = null
          }
          analyserRef.current = null
          onAnalyserReadyRef.current(null)

          if (destinationNodeRef.current) {
            destinationNodeRef.current = null
            onAudioStreamReadyRef.current?.(null)
          }
        }
      },
    })
    mirrorRef.current = mirror as StrudelMirrorExt
    // Apply initial keybindings and theme from current settings
    mirrorRef.current.changeSetting('keybindings', vimModeRef.current ? 'vim' : 'codemirror')
    mirrorRef.current.setTheme(mapToStrudelTheme(themeNameRef.current))
    return () => {
      if (analyserRef.current) {
        const dg = destinationGainRef.current
        if (dg) {
          try { dg.disconnect(analyserRef.current) } catch { /* node may have been reset */ }
          if (destinationNodeRef.current) {
            try { dg.disconnect(destinationNodeRef.current) } catch { /* node may have been reset */ }
          }
          destinationGainRef.current = null
        }
        analyserRef.current = null
        onAnalyserReadyRef.current(null)
      }
      if (destinationNodeRef.current) {
        destinationNodeRef.current = null
        onAudioStreamReadyRef.current?.(null)
      }
      mirror.clear()
      mirror.editor.destroy()
      mirror.stop().catch(console.error)
    }
  }, [])

  const saveCode = useCallback(() => {
    localStorage.setItem(LS_STRUDEL_CODE, mirrorRef.current?.code ?? DEFAULT_STRUDEL_CODE)
  }, [])

  // Apply vim/normal keybindings whenever the setting changes
  useEffect(() => {
    mirrorRef.current?.changeSetting('keybindings', vimMode ? 'vim' : 'codemirror')
  }, [vimMode])

  // Apply the CodeMirror theme whenever the app theme changes
  useEffect(() => {
    mirrorRef.current?.setTheme(mapToStrudelTheme(themeName))
  }, [themeName])

  // Persist the strudel code when the tab is hidden or the page is unloaded
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') { saveCode() }
    }
    document.addEventListener('visibilitychange', onHide)
    return () => document.removeEventListener('visibilitychange', onHide)
  }, [saveCode])

  const handleRun = useCallback(() => {
    saveCode()
    mirrorRef.current?.evaluate().catch(console.error)
  }, [saveCode])

  const handleStop = useCallback(() => {
    saveCode()
    mirrorRef.current?.stop().catch(console.error)
  }, [saveCode])

  const handleExport = useCallback(() => {
    const code = mirrorRef.current?.code ?? DEFAULT_STRUDEL_CODE
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const safeName = strudelTitle
      .replace(/[^\w\s.-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^[_\s]+|[_\s]+$/g, '')
      .trim() || 'pattern'
    a.download = safeName + '.strudel'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [strudelTitle])

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      const content = evt.target?.result as string
      if (content !== undefined && mirrorRef.current) {
        mirrorRef.current.setCode(content)
        localStorage.setItem(LS_STRUDEL_CODE, content)
        const name = file.name.replace(/\.[^.]+$/, '')
        setStrudelTitle(name)
        localStorage.setItem(LS_STRUDEL_TITLE, name)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }, [])

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setStrudelTitle(e.target.value)
    localStorage.setItem(LS_STRUDEL_TITLE, e.target.value)
  }, [])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'var(--pg-bg-panel)' }}>
      <ShaderHeader
        title={strudelTitle}
        isPlaying={isPlaying}
        onTitleChange={handleTitleChange}
        onImport={handleImportClick}
        onExport={handleExport}
        onShowSounds={() => setSoundsOpen(true)}
        onRun={handleRun}
        onStop={handleStop}
        titleAriaLabel="Strudel pattern title"
        importAriaLabel="Import pattern from file"
        exportAriaLabel="Export pattern to file"
        runLabel="Play Strudel"
        runColor="success"
      />

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".strudel,.js,.txt"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Strudel CodeMirror editor – fills available space; click empty area to focus */}
      <Box
        ref={rootRef}
        onClick={() => {
          // Focus the CodeMirror editor when clicking the empty area below content
          const view = mirrorRef.current?.editor as { hasFocus?: boolean; focus?: () => void } | undefined
          if (view?.focus && !view.hasFocus) view.focus()
        }}
        sx={{
          flex: 1,
          overflow: 'hidden',
          cursor: 'text',
          '& .cm-editor': { height: '100%', fontSize: '13px' },
          '& .cm-scroller': { fontFamily: 'monospace', overflow: 'auto !important' },
        }}
      />

      <SoundsModal open={soundsOpen} onClose={() => setSoundsOpen(false)} />
    </Box>
  )
})

export default StrudelPane
