import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import { StrudelMirror } from '@strudel/codemirror'
import { evalScope } from '@strudel/core'
import { webaudioOutput, getAudioContext, initAudioOnFirstClick, getSuperdoughAudioController, registerSynthSounds, registerZZFXSounds, soundAlias } from '@strudel/webaudio'
import { transpiler } from '@strudel/transpiler'
import StrudelError from '../StrudelError/StrudelError'
import SoundsPanel from '../SoundsPanel/SoundsPanel'
import { registerInstruments } from '../../utility/strudel/instruments'
import { registerUserSampleSound, preloadUserSamples } from '../../utility/strudel/userSamples'
import { saveStrudelCode, saveStrudelTitle, getInitialStrudelCode, getInitialStrudelTitle, useAppStorage } from '../../hooks/useAppStorage'
import { useStrudelSettings } from '../../hooks/useStrudelSettings'
import { useTheme } from '../../hooks/useTheme'
import { DEFAULT_STRUDEL_CODE, DEFAULT_STRUDEL_TITLE } from '../../constants/editorConstants'
// @strudel/codemirror ships no TypeScript declarations; augment the methods we use
type StrudelMirrorExt = StrudelMirror & {
  changeSetting: (key: string, value: unknown) => void
  setTheme: (name: string) => void
}

// Custom prebake: loads the evalScope globals needed for Strudel pattern evaluation
// for samples we do not expose in the UI.
// The synthesised sounds (oscillators, 909 drums, ZZFX, acid bass) registered below
// are always available offline.
const minimalPrebake = async (): Promise<void> => {
  registerSynthSounds()
  registerZZFXSounds()
  registerInstruments()
  // Register 'bd' as a fallback alias for 'sbd' (synth bass drum) so patterns
  // using the common 'bd' name work even without remote sample banks.
  soundAlias('sbd', 'bd')

  // Load all evalScope modules so that Strudel pattern functions (note, sound,
  // slow, fast, lpf, …) are available as globals at evaluation time.
  // These are local JavaScript imports – no network requests for audio files.
  await evalScope(
    import('@strudel/core'),
    import('@strudel/mini'),
    import('@strudel/tonal'),
    import('@strudel/webaudio'),
    import('@strudel/codemirror'),
  ).catch(() => {
    console.warn('[strudel] Some pattern modules failed to load.')
  })
}



export interface StrudelPaneHandle {
  play: () => void
  pause: () => void
  loadExample: (title: string, content: string) => void
  closeSounds: () => void
  getTitle: () => string
  setTitle: (title: string) => void
  save: () => void
  triggerImport: () => void
  triggerExport: () => void
  toggleSounds: () => void
}

interface StrudelPaneProps {
  onAnalyserReady: (analyser: AnalyserNode | null) => void
  onAudioStreamReady?: (stream: MediaStream | null) => void
  onSave: (title: string, content: string) => void
}

const StrudelPane = forwardRef<StrudelPaneHandle, StrudelPaneProps>(function StrudelPane(
  { onAnalyserReady, onAudioStreamReady, onSave },
  ref,
) {
	const { muted, volume, userSamples } = useAppStorage()
	const { strudelTheme } = useTheme()
  const rootRef = useRef<HTMLDivElement>(null)
  const mirrorRef = useRef<StrudelMirrorExt | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const destinationNodeRef = useRef<MediaStreamAudioDestinationNode | null>(null)
  /** Reference to the GainNode we connected our analyser/destination to, so we can remove those connections cleanly on stop */
  const destinationGainRef = useRef<GainNode | null>(null)
  const isPlayingRef = useRef(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [, setIsPlaying] = useState(false)
  const [strudelTitle, setStrudelTitle] = useState(
    () => getInitialStrudelTitle(DEFAULT_STRUDEL_TITLE),
  )
  const [soundsOpen, setSoundsOpen] = useState(false)
  /** Ratio (20–80) of the strudel-only sounds split: editor top / sounds bottom */
  const [soundsSplitRatio, setSoundsSplitRatio] = useState(50)
  const soundsPaneRef = useRef<HTMLDivElement>(null)
  /** Most-recently seen error message – used to deduplicate identical errors */
  const lastErrorRef = useRef<string | null>(null)
  const [strudelError, setStrudelError] = useState<string | null>(null)
  const onAnalyserReadyRef = useRef(onAnalyserReady)
  onAnalyserReadyRef.current = onAnalyserReady
  const onAudioStreamReadyRef = useRef(onAudioStreamReady)
  onAudioStreamReadyRef.current = onAudioStreamReady
  const volumeRef = useRef(volume)
  volumeRef.current = volume
  const mutedRef = useRef(muted)
  mutedRef.current = muted

  const { vimMode, fontSize, strudelAutocomplete } = useStrudelSettings(mirrorRef)

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
      saveStrudelCode(content)
      setStrudelTitle(title)
      saveStrudelTitle(title)
    },
    closeSounds() {
      setSoundsOpen(false)
    },
    getTitle() {
      return strudelTitle
    },
    setTitle(title: string) {
      setStrudelTitle(title)
      saveStrudelTitle(title)
    },
    save() {
      const code = mirrorRef.current?.code ?? DEFAULT_STRUDEL_CODE
      onSave(strudelTitle, code)
    },
    triggerImport() {
      fileInputRef.current?.click()
    },
    triggerExport() {
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
    },
    toggleSounds() {
      setSoundsOpen(v => !v)
    },
  }), [strudelTitle, onSave])

  useEffect(() => {
    if (!rootRef.current) return
    // Read initial code inside the effect so it runs after the previous
    // StrudelPane instance's cleanup has flushed its code to localStorage
    // (e.g. when toggling immersive mode causes an unmount/remount cycle).
    const initialCode = getInitialStrudelCode(DEFAULT_STRUDEL_CODE)
    initAudioOnFirstClick()
    const mirror = new StrudelMirror({
      root: rootRef.current,
      initialCode,
      prebake: minimalPrebake,
      defaultOutput: webaudioOutput,
      getTime: () => getAudioContext()?.currentTime ?? 0,
      transpiler,
      solo: false,
      bgFill: false,
      onEvalError: (err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err)
        // Only update the displayed error when the message changes (suppress repeated identical errors)
        if (msg !== lastErrorRef.current) {
          lastErrorRef.current = msg
          setStrudelError(msg)
        }
      },
      afterEval: () => {
        // Clear any previously shown eval error when evaluation succeeds
        if (lastErrorRef.current !== null) {
          lastErrorRef.current = null
          setStrudelError(null)
        }
      },
      onToggle: (started: boolean) => {
        isPlayingRef.current = started
        setIsPlaying(started)
        if (started) {
          // Clear any previously shown eval error when playback starts successfully
          lastErrorRef.current = null
          setStrudelError(null)
        }
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

            // Apply current volume/mute settings immediately
            dg.gain.value = mutedRef.current ? 0 : volumeRef.current / 100

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
    // Apply initial keybindings, theme, and font size from current settings
    mirrorRef.current.changeSetting('keybindings', vimMode ? 'vim' : 'codemirror')
    mirrorRef.current.changeSetting('isTabIndentationEnabled', true)
    mirrorRef.current.changeSetting('fontSize', fontSize)
    mirrorRef.current.changeSetting('isAutoCompletionEnabled', strudelAutocomplete)
    mirrorRef.current.setTheme(strudelTheme)
    return () => {
      // Persist the current code so it is restored if the component remounts
      // (e.g. when toggling immersive mode)
      saveStrudelCode(mirror.code ?? DEFAULT_STRUDEL_CODE)
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
    saveStrudelCode(mirrorRef.current?.code ?? DEFAULT_STRUDEL_CODE)
  }, [])

  // Apply volume / mute to the Strudel GainNode whenever either changes
  useEffect(() => {
    const dg = destinationGainRef.current
    if (dg) {
      dg.gain.value = muted ? 0 : volume / 100
    }
  }, [volume, muted])

  // Persist the strudel code when the tab is hidden or the page is unloaded
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') { saveCode() }
    }
    document.addEventListener('visibilitychange', onHide)
    return () => document.removeEventListener('visibilitychange', onHide)
  }, [saveCode])

  // Register user-uploaded samples with Strudel whenever the list changes
  useEffect(() => {
    for (const sample of userSamples) {
      registerUserSampleSound(sample)
    }
    // Eagerly decode buffers once the AudioContext becomes available
    const ctx = getAudioContext()
    if (ctx) {
      preloadUserSamples(userSamples)
    }
  }, [userSamples])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      const content = evt.target?.result as string
      if (content !== undefined && mirrorRef.current) {
        mirrorRef.current.setCode(content)
        saveStrudelCode(content)
        const name = file.name.replace(/\.[^.]+$/, '')
        setStrudelTitle(name)
        saveStrudelTitle(name)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }, [])

  const handleSoundsDividerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const pane = soundsPaneRef.current
    if (!pane) return
    const startY = e.clientY
    const startRatio = soundsSplitRatio
    const paneH = pane.getBoundingClientRect().height
    const onMove = (me: MouseEvent) => {
      const delta = me.clientY - startY
      const newRatio = Math.min(80, Math.max(20, startRatio + (delta / paneH) * 100))
      setSoundsSplitRatio(newRatio)
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [soundsSplitRatio])

  return (
    <Box ref={soundsPaneRef} sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'background.panel', pt: '44px' }}>
      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".strudel,.js,.txt"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <StrudelError error={strudelError} />

      {/* Strudel CodeMirror editor – always mounted so StrudelMirror stays alive.
          Height shrinks to give space to the sounds panel when it is open. */}
      <Box
        ref={rootRef}
        onClick={() => {
          const view = mirrorRef.current?.editor as { hasFocus?: boolean; focus?: () => void } | undefined
          if (view?.focus && !view.hasFocus) view.focus()
        }}
        sx={{
          flex: soundsOpen ? undefined : 1,
          height: soundsOpen ? `${soundsSplitRatio}%` : undefined,
          overflow: 'hidden',
          cursor: 'text',
          '& .cm-editor': { height: '100%', fontSize: `${fontSize}px` },
          '& .cm-scroller': { fontFamily: 'monospace', overflow: 'auto !important' },
        }}
      />

      {/* Resizable divider and sounds panel */}
      {soundsOpen && (
        <>
          <Box
            onMouseDown={handleSoundsDividerMouseDown}
            sx={{
              height: '4px',
              bgcolor: 'border.faint',
              cursor: 'row-resize',
              flexShrink: 0,
              '&:hover': { bgcolor: 'border.faint' },
            }}
          />
          <Box sx={{ height: `${100 - soundsSplitRatio}%`, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <SoundsPanel />
          </Box>
        </>
      )}
    </Box>
  )
})

export default StrudelPane
