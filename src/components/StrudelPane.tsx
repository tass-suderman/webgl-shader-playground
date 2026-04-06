import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import InputBase from '@mui/material/InputBase'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import CloseIcon from '@mui/icons-material/Close'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import FileUploadIcon from '@mui/icons-material/FileUpload'
import MusicNoteIcon from '@mui/icons-material/MusicNote'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import StopIcon from '@mui/icons-material/Stop'
import { StrudelMirror } from '@strudel/codemirror'
import { prebake } from '@strudel/repl'
import { webaudioOutput, getAudioContext, initAudioOnFirstClick, getSuperdoughAudioController, registerSynthSounds, registerZZFXSounds } from '@strudel/webaudio'
import { transpiler } from '@strudel/transpiler'
import ExamplesPanel from './ExamplesPanel'

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

// ---------------------------------------------------------------------------
// Sounds reference data
// ---------------------------------------------------------------------------

const SOUND_CATEGORIES = [
  {
    label: 'Oscillator waveforms',
    sounds: ['sine', 'sawtooth', 'square', 'triangle'],
    aliases: { sin: 'sine', saw: 'sawtooth', sqr: 'square', tri: 'triangle' },
  },
  {
    label: 'Synth voices',
    sounds: ['sbd', 'supersaw', 'bytebeat', 'pulse', 'bus', 'user', 'one'],
  },
  {
    label: 'Noise',
    sounds: ['pink', 'white', 'brown', 'crackle'],
  },
  {
    label: 'ZZFX (procedural)',
    sounds: ['zzfx', 'z_sine', 'z_sawtooth', 'z_triangle', 'z_square', 'z_tan', 'z_noise'],
  },
] as const

// Map app theme names to CodeMirror / Strudel editor themes
function mapToStrudelTheme(themeName: string): string {
  if (themeName === 'kanagawa') return 'tokyoNight'
  return 'vscodeDark'
}

export interface StrudelPaneHandle {
  play: () => void
  pause: () => void
}

interface StrudelPaneProps {
  onAnalyserReady: (analyser: AnalyserNode | null) => void
  onAudioStreamReady?: (stream: MediaStream | null) => void
  vimMode: boolean
  themeName: string
}

const StrudelPane = forwardRef<StrudelPaneHandle, StrudelPaneProps>(function StrudelPane(
  { onAnalyserReady, onAudioStreamReady, vimMode, themeName },
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
  const [activeTab, setActiveTab] = useState<'editor' | 'examples'>('editor')
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
            try { dg.disconnect(analyserRef.current) } catch (_) { /* node may have been reset */ }
            if (destinationNodeRef.current) {
              try { dg.disconnect(destinationNodeRef.current) } catch (_) { /* node may have been reset */ }
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
          try { dg.disconnect(analyserRef.current) } catch (_) { /* node may have been reset */ }
          if (destinationNodeRef.current) {
            try { dg.disconnect(destinationNodeRef.current) } catch (_) { /* node may have been reset */ }
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleLoadExample = useCallback((title: string, content: string) => {
    if (mirrorRef.current) {
      mirrorRef.current.setCode(content)
      mirrorRef.current.evaluate().catch(console.error)
    }
    localStorage.setItem(LS_STRUDEL_CODE, content)
    setStrudelTitle(title)
    localStorage.setItem(LS_STRUDEL_TITLE, title)
    setActiveTab('editor')
  }, [])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'var(--pg-bg-panel)' }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1,
          bgcolor: 'var(--pg-bg-header)',
          borderBottom: '1px solid var(--pg-border-subtle)',
          flexShrink: 0,
          gap: 1,
        }}
      >
        {/* Editable title */}
        <InputBase
          value={strudelTitle}
          onChange={handleTitleChange}
          inputProps={{ 'aria-label': 'Strudel pattern title' }}
          sx={{
            color: 'var(--pg-text-primary)',
            fontFamily: 'monospace',
            fontSize: '0.875rem',
            flex: 1,
            minWidth: 0,
            '& input': { p: 0, cursor: 'text' },
          }}
        />

        <Tooltip title="Import pattern from file">
          <IconButton size="small" onClick={handleImportClick} aria-label="Import pattern from file" sx={{ color: 'var(--pg-text-primary)' }}>
            <FileUploadIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Export pattern to file">
          <IconButton size="small" onClick={handleExport} aria-label="Export pattern to file" sx={{ color: 'var(--pg-text-primary)' }}>
            <FileDownloadIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Available sounds">
          <IconButton size="small" onClick={() => setSoundsOpen(true)} aria-label="Available sounds" sx={{ color: 'var(--pg-text-primary)' }}>
            <MusicNoteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Reset to default pattern">
          <IconButton size="small" onClick={handleReset} aria-label="Reset to default pattern" sx={{ color: 'var(--pg-text-primary)' }}>
            <RestartAltIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Button
          variant="contained"
          color="success"
          size="small"
          startIcon={<PlayArrowIcon />}
          onClick={handleRun}
          sx={{ textTransform: 'none', flexShrink: 0 }}
        >
          Play Strudel
        </Button>
        <Button
          variant="outlined"
          color="error"
          size="small"
          startIcon={<StopIcon />}
          onClick={handleStop}
          disabled={!isPlaying}
          sx={{ textTransform: 'none', flexShrink: 0 }}
        >
          Stop
        </Button>
      </Box>

      {/* Keyboard hint */}
      <Box
        sx={{
          px: 2,
          py: 0.5,
          bgcolor: 'var(--pg-bg-header)',
          borderBottom: '1px solid var(--pg-border-faint)',
          flexShrink: 0,
        }}
      >
        <Typography variant="caption" sx={{ color: 'var(--pg-text-muted)', fontFamily: 'monospace' }}>
          Alt+Enter to play · Alt+. to pause
        </Typography>
      </Box>

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".strudel,.js,.txt"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Editor / Examples tab bar */}
      <Tabs
        value={activeTab}
        onChange={(_e, val: 'editor' | 'examples') => setActiveTab(val)}
        sx={{
          minHeight: 32,
          flexShrink: 0,
          bgcolor: '#252526',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          '& .MuiTabs-indicator': { height: 2 },
        }}
      >
        <Tab
          label="Editor"
          value="editor"
          sx={{ minHeight: 32, py: 0.5, px: 2, fontSize: '0.75rem', textTransform: 'none', color: 'rgba(255,255,255,0.6)' }}
        />
        <Tab
          label="Examples"
          value="examples"
          sx={{ minHeight: 32, py: 0.5, px: 2, fontSize: '0.75rem', textTransform: 'none', color: 'rgba(255,255,255,0.6)' }}
        />
      </Tabs>

      {/* Strudel CodeMirror editor */}
      <Box
        ref={rootRef}
        sx={{
          flex: 1,
          overflow: 'auto',
          display: activeTab === 'editor' ? 'block' : 'none',
          '& .cm-editor': { minHeight: '100%', fontSize: '13px' },
          '& .cm-scroller': { fontFamily: 'monospace' },
        }}
      />

      {/* Examples panel */}
      {activeTab === 'examples' && (
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <ExamplesPanel type="strudel" onLoad={handleLoadExample} />
        </Box>
      )}

      {/* Sounds reference modal */}
      <Dialog
        open={soundsOpen}
        onClose={() => setSoundsOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { bgcolor: 'var(--pg-bg-panel)', color: 'var(--pg-text-primary)' } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Typography variant="h6" sx={{ fontFamily: 'monospace', fontSize: '1rem' }}>
            Available Sounds
          </Typography>
          <IconButton size="small" onClick={() => setSoundsOpen(false)} aria-label="Close sounds dialog" sx={{ color: 'var(--pg-text-primary)' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 0 }}>
          {SOUND_CATEGORIES.map(cat => (
            <Box key={cat.label} sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ color: 'var(--pg-text-muted)', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {cat.label}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                {cat.sounds.map(s => (
                  <Typography
                    key={s}
                    component="code"
                    sx={{ bgcolor: 'var(--pg-bg-button)', px: 0.75, py: 0.25, borderRadius: 0.5, fontSize: '0.8rem', fontFamily: 'monospace', color: '#9cdcfe' }}
                  >
                    {s}
                  </Typography>
                ))}
              </Box>
              {'aliases' in cat && Object.keys(cat.aliases).length > 0 && (
                <Typography variant="caption" sx={{ color: 'var(--pg-text-muted)', fontFamily: 'monospace', display: 'block', mt: 0.5 }}>
                  Aliases: {Object.entries(cat.aliases).map(([a, b]) => `${a} → ${b}`).join(', ')}
                </Typography>
              )}
            </Box>
          ))}
          <Typography variant="caption" sx={{ color: 'var(--pg-text-muted)', fontFamily: 'monospace', display: 'block', mt: 1 }}>
            Use with <code style={{ color: '#9cdcfe' }}>.sound("name")</code> in your pattern.
          </Typography>
        </DialogContent>
      </Dialog>
    </Box>
  )
})

export default StrudelPane
