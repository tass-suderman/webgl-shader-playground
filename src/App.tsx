import { useState, useCallback, useEffect, useRef } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Collapse from '@mui/material/Collapse'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControlLabel from '@mui/material/FormControlLabel'
import IconButton from '@mui/material/IconButton'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'
import CloseIcon from '@mui/icons-material/Close'
import useMediaQuery from '@mui/material/useMediaQuery'
import type { SxProps, Theme } from '@mui/material/styles'
import ShaderPane, { type ShaderPaneHandle } from './components/shader/ShaderPane'
import ShaderControls from './components/shader/ShaderControls'
import EditorPane, { type EditorPaneHandle } from './components/editor/EditorPane'
import BufferEditorPane from './components/editor/BufferEditorPane'
import StrudelPane, { type StrudelPaneHandle } from './components/strudel/StrudelPane'
import SettingsPane from './components/settings/SettingsPane'
import SavedPane from './components/editor/SavedPane'
import AboutPane from './components/about/AboutPane'
import { applyTheme, getThemeByName } from './themes/appThemes'
import { useMediaStreams } from './hooks/useMediaStreams'
import {
  useAppStorage,
  getInitialGlslCode,
  getInitialBuffer3Code,
  getInitialBuffer4Code,
  getInitialBuffer6Code,
  saveBuffer3Code,
  saveBuffer4Code,
  saveBuffer6Code,
} from './hooks/useAppStorage'
import { useSavedContent } from './hooks/useSavedContent'

type DisplayMode = 'default' | 'immersive'

// Computed once at module load – used to seed the initial shader state so the
// last-saved shader is both displayed in the editor and running on the GPU
// without waiting for a user action.
const initialShaderCode = getInitialGlslCode()
const initialBuffer3Code = getInitialBuffer3Code()
const initialBuffer4Code = getInitialBuffer4Code()
const initialBuffer6Code = getInitialBuffer6Code()

type ViewMode = 'glsl' | 'strudel' | 'buffer3' | 'buffer4' | 'buffer6' | 'saved' | 'settings' | 'about'

/** Controls the colour applied to a tab toggle button. */
type ButtonVariant = 'editor' | 'utility'

// Shared base styles for all top-bar toggle buttons
const baseTabSx = {
  backgroundColor: 'var(--pg-bg-button)',
  borderRadius: '15px',
  fontSize: '0.75rem',
  py: 0.25,
  px: 1.5,
  textTransform: 'none',
  flex: 1,
  '&.Mui-selected': {
    backgroundColor: 'var(--pg-accent)',
    color: 'var(--pg-text-hover)',
  },
  '&:hover': {
    backgroundColor: 'var(--pg-bg-hover)',
    color: 'var(--pg-text-hover)',
  },
} as const

const tabSxByVariant: Record<ButtonVariant, object> = {
  // Editor mode tabs (GLSL / Strudel) – primary text colour
  editor: { ...baseTabSx, color: 'var(--pg-text-button)' },
  // Utility tabs (Examples / Settings / About) – warm complementary text colour
  utility: { ...baseTabSx, color: 'var(--pg-text-util-tab)' },
}

/** A single tab in the top bar with a typed colour variant. */
function TabButton({ value, variant, children }: { value: string; variant: ButtonVariant; children: React.ReactNode }) {
  return (
    <ToggleButton value={value} sx={tabSxByVariant[variant]}>
      {children}
    </ToggleButton>
  )
}

export default function App() {
  const [shaderSource, setShaderSource] = useState<string>(initialShaderCode)
  const [pendingSource, setPendingSource] = useState<string>(initialShaderCode)
  const [shaderError, setShaderError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('glsl')
  const [strudelAnalyser, setStrudelAnalyser] = useState<AnalyserNode | null>(null)
  const [strudelAudioStream, setStrudelAudioStream] = useState<MediaStream | null>(null)
  // Buffer pass sources: active (running on GPU) and pending (editor content)
  const [bufferSources, setBufferSources] = useState<[string | null, string | null, string | null]>([
    initialBuffer3Code, initialBuffer4Code, initialBuffer6Code,
  ])
  const [pendingBuffer3, setPendingBuffer3] = useState<string>(initialBuffer3Code)
  const [pendingBuffer4, setPendingBuffer4] = useState<string>(initialBuffer4Code)
  const [pendingBuffer6, setPendingBuffer6] = useState<string>(initialBuffer6Code)
  const [leftRatio, setLeftRatio] = useState(50)
  /** On mobile the canvas occupies this % of viewport height (editor gets the rest) */
  const [mobileShaderRatio, setMobileShaderRatio] = useState(50)
  const [editorCollapsed, setEditorCollapsed] = useState(false)
  const {
    theme: themeName, setTheme: setThemeName,
    vimMode, setVimMode,
    volume, setVolume,
    muted, setMuted,
    immersiveOpacity, setImmersiveOpacity,
    fontSize, setFontSize,
    warnOnOverwrite, setWarnOnOverwrite,
  } = useAppStorage()
  const savedContent = useSavedContent()
  // Overwrite warning dialog state
  const [overwriteDialogOpen, setOverwriteDialogOpen] = useState(false)
  const [overwritePending, setOverwritePending] = useState<{ title: string; content: string; type: 'shader' | 'pattern' } | null>(null)
  const [dontShowAgain, setDontShowAgain] = useState(false)
  const [displayMode, setDisplayMode] = useState<DisplayMode>('default')
  // State mirrored from ShaderPane for use in the immersive controls bar
  const [immersiveShaderPlaying, setImmersiveShaderPlaying] = useState(true)
  const [immersiveShaderRecording, setImmersiveShaderRecording] = useState(false)
  const [immersiveShaderFullscreen, setImmersiveShaderFullscreen] = useState(false)
  const outerContainerRef = useRef<HTMLDivElement>(null)
  const strudelRef = useRef<StrudelPaneHandle>(null)
  const editorRef = useRef<EditorPaneHandle>(null)
  const shaderRef = useRef<ShaderPaneHandle>(null)
  // Keep a ref to pendingSource for the global keydown handler (avoids stale closure)
  const pendingSourceRef = useRef(pendingSource)
  pendingSourceRef.current = pendingSource

  /** True when the viewport is narrow enough to be considered a phone/small device */
  const isMobile = useMediaQuery('(max-width: 600px)')

  const {
    webcamEnabled,
    micEnabled,
    webcamStream,
    audioStream,
    handleToggleWebcam,
    handleToggleMic,
  } = useMediaStreams()

  // Apply the active theme as CSS custom properties whenever it changes
  useEffect(() => {
    applyTheme(getThemeByName(themeName))
  }, [themeName])

  // Apply / remove immersive mode CSS variable and data attribute
  useEffect(() => {
    if (displayMode === 'immersive') {
      document.documentElement.dataset.immersive = 'true'
      document.documentElement.style.setProperty('--pg-immersive-alpha', `${immersiveOpacity}%`)
    } else {
      delete document.documentElement.dataset.immersive
      document.documentElement.style.removeProperty('--pg-immersive-alpha')
    }
  }, [displayMode, immersiveOpacity])

  const handleThemeChange = useCallback((name: string) => {
    setThemeName(name)
  }, [setThemeName])

  const handleToggleImmersive = useCallback(() => {
    setDisplayMode(m => m === 'immersive' ? 'default' : 'immersive')
  }, [])

  const handleVimModeChange = useCallback((enabled: boolean) => {
    setVimMode(enabled)
  }, [setVimMode])

  const handleVolumeChange = useCallback((value: number) => {
    setVolume(value)
  }, [setVolume])

  const handleToggleMute = useCallback(() => {
    setMuted(!muted)
  }, [muted, setMuted])

  const handleRun = useCallback((code: string) => {
    setShaderSource(code)
  }, [])

  const handleRunBuffer3 = useCallback((code: string) => {
    setBufferSources(prev => [code, prev[1], prev[2]])
  }, [])

  const handleRunBuffer4 = useCallback((code: string) => {
    setBufferSources(prev => [prev[0], code, prev[2]])
  }, [])

  const handleRunBuffer6 = useCallback((code: string) => {
    setBufferSources(prev => [prev[0], prev[1], code])
  }, [])

  // Global keyboard shortcuts (capture phase so they fire before Monaco / CodeMirror)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
			const handleKeyboardEvent = (e: KeyboardEvent, keyboardAction: () => void) => {
				e.preventDefault()
				e.stopPropagation()
				keyboardAction()
			}

      // Ctrl+Enter / Cmd+Enter → Play Shader (run/compile) and unpause if paused
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
				handleKeyboardEvent(e, () => shaderRef.current?.unpause())
        return
      }
      // Ctrl+. / Cmd+. → Toggle Shader pause/unpause
      if ((e.ctrlKey || e.metaKey) && e.key === '.') {
				handleKeyboardEvent(e, () => shaderRef.current?.togglePlay())
        return
      }
      // Alt+Enter → Play Strudel
      if (e.altKey && e.key === 'Enter') {
				handleKeyboardEvent(e, () => strudelRef.current?.play())
        return
      }
      // Alt+. → Pause Strudel
      if (e.altKey && e.key === '.') {
				handleKeyboardEvent(e, () => strudelRef.current?.pause())
      }
    }
    window.addEventListener('keydown', handler, { capture: true })
    return () => window.removeEventListener('keydown', handler, { capture: true })
  }, [])

  /** Horizontal divider between shader and editor (desktop side-by-side layout) */
  const handleHorizontalDividerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const container = outerContainerRef.current
    if (!container) return
    const startX = e.clientX
    const startRatio = leftRatio
    const containerW = container.getBoundingClientRect().width
    const onMove = (me: MouseEvent) => {
      const delta = me.clientX - startX
      const newRatio = Math.min(80, Math.max(20, startRatio + (delta / containerW) * 100))
      setLeftRatio(newRatio)
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [leftRatio])

  /** Horizontal divider between shader (top) and editor (bottom) on mobile */
  const handleMobileDividerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const container = outerContainerRef.current
    if (!container) return
    const startY = e.clientY
    const startRatio = mobileShaderRatio
    const containerH = container.getBoundingClientRect().height
    const onMove = (me: MouseEvent) => {
      const delta = me.clientY - startY
      const newRatio = Math.min(80, Math.max(20, startRatio + (delta / containerH) * 100))
      setMobileShaderRatio(newRatio)
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [mobileShaderRatio])

  // ── Examples loading ───────────────────────────────────────────────────────

  const handleLoadGlslExample = useCallback((title: string, content: string) => {
    editorRef.current?.loadExample(title, content)
    setViewMode('glsl')
  }, [])

  const handleLoadStrudelExample = useCallback((title: string, content: string) => {
    strudelRef.current?.loadExample(title, content)
    setViewMode('strudel')
  }, [])

  // ── Saved content: load saved entries into editors ─────────────────────────

  const handleLoadSavedShader = useCallback((title: string, content: string) => {
    editorRef.current?.loadExample(title, content)
    setViewMode('glsl')
  }, [])

  const handleLoadSavedPattern = useCallback((title: string, content: string) => {
    strudelRef.current?.loadExample(title, content)
    setViewMode('strudel')
  }, [])

  // ── Save flow with optional overwrite confirmation ─────────────────────────

  const commitSave = useCallback((title: string, content: string, type: 'shader' | 'pattern') => {
    if (type === 'shader') {
      savedContent.saveShader(title, content)
    } else {
      savedContent.savePattern(title, content)
    }
  }, [savedContent])

  const handleSaveShader = useCallback((title: string, content: string) => {
    if (warnOnOverwrite && savedContent.hasExistingShader(title)) {
      setOverwritePending({ title, content, type: 'shader' })
      setDontShowAgain(false)
      setOverwriteDialogOpen(true)
    } else {
      commitSave(title, content, 'shader')
    }
  }, [warnOnOverwrite, savedContent, commitSave])

  const handleSavePattern = useCallback((title: string, content: string) => {
    if (warnOnOverwrite && savedContent.hasExistingPattern(title)) {
      setOverwritePending({ title, content, type: 'pattern' })
      setDontShowAgain(false)
      setOverwriteDialogOpen(true)
    } else {
      commitSave(title, content, 'pattern')
    }
  }, [warnOnOverwrite, savedContent, commitSave])

  const handleOverwriteConfirm = useCallback(() => {
    if (overwritePending) {
      if (dontShowAgain) {
        setWarnOnOverwrite(false)
      }
      commitSave(overwritePending.title, overwritePending.content, overwritePending.type)
    }
    setOverwriteDialogOpen(false)
    setOverwritePending(null)
  }, [overwritePending, dontShowAgain, setWarnOnOverwrite, commitSave])

  const handleOverwriteCancel = useCallback(() => {
    setOverwriteDialogOpen(false)
    setOverwritePending(null)
  }, [])

  const showGlsl = viewMode === 'glsl'
  const showStrudel = viewMode === 'strudel'
  const showBuffer3 = viewMode === 'buffer3'
  const showBuffer4 = viewMode === 'buffer4'
  const showBuffer6 = viewMode === 'buffer6'

  // Sx helpers for the animated editor panel Collapse – extracted for readability
  const mobileEditorCollapseSx = {
    flex: !editorCollapsed ? 1 : undefined,
    minHeight: 0,
    display: !editorCollapsed ? 'flex' : undefined,
    flexDirection: 'column',
  } as const

  const desktopEditorCollapseSx = {
    flex: !editorCollapsed ? 1 : undefined,
    minWidth: 0,
    display: !editorCollapsed ? 'flex' : undefined,
    flexDirection: 'column',
    '& .MuiCollapse-wrapper, & .MuiCollapse-wrapperInner': {
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
    },
  } as SxProps<Theme>

  // ── Tab bar ────────────────────────────────────────────────────────────────

  const tabBar = (
    <Box sx={{
      px: 1,
      py: 0.5,
      bgcolor: 'var(--pg-bg-header)',
      borderBottom: '1px solid var(--pg-border-subtle)',
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      gap: 1,
    }}>
      <ToggleButtonGroup
        value={viewMode}
        exclusive
        onChange={(_e, val: string | null) => {
          if (!val) return
          setViewMode(val as ViewMode)
          strudelRef.current?.closeSounds()
        }}
        size="small"
        sx={{ flex: 1, minWidth: 0 }}
      >
        <TabButton value="glsl" variant="editor">GLSL</TabButton>
        <TabButton value="strudel" variant="editor">Strudel</TabButton>
        <TabButton value="buffer3" variant="editor">Buffer A</TabButton>
        <TabButton value="buffer4" variant="editor">Buffer B</TabButton>
        <TabButton value="buffer6" variant="editor">Buffer C</TabButton>
        <TabButton value="saved" variant="utility">Saved</TabButton>
        <TabButton value="settings" variant="utility">Settings</TabButton>
        <TabButton value="about" variant="utility">About</TabButton>
      </ToggleButtonGroup>
    </Box>
  )

  // ── Editor content area (shared between mobile and desktop) ───────────────

  const editorContent = (
    <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      {/* About panel */}
      {viewMode === 'about' && <AboutPane />}

      {/* Settings panel */}
      {viewMode === 'settings' && (
        <SettingsPane
          vimMode={vimMode}
          onVimModeChange={handleVimModeChange}
          themeName={themeName}
          onThemeChange={handleThemeChange}
          fontSize={fontSize}
          onFontSizeChange={setFontSize}
          warnOnOverwrite={warnOnOverwrite}
          onWarnOnOverwriteChange={setWarnOnOverwrite}
        />
      )}

      {/* Saved panel (Saved Content + Examples) */}
      {viewMode === 'saved' && (
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <SavedPane
            savedShaders={savedContent.savedShaders}
            savedPatterns={savedContent.savedPatterns}
            onDeleteShader={savedContent.deleteShader}
            onDeletePattern={savedContent.deletePattern}
            onLoadShader={handleLoadSavedShader}
            onLoadPattern={handleLoadSavedPattern}
            onLoadGlslExample={handleLoadGlslExample}
            onLoadStrudelExample={handleLoadStrudelExample}
          />
        </Box>
      )}

      {/* GLSL editor – hidden but mounted when not visible to preserve state */}
      <Box sx={{
        display: showGlsl ? 'flex' : 'none',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
      }}>
        <EditorPane
          ref={editorRef}
          initialCode={initialShaderCode}
          onRun={handleRun}
          pendingSource={pendingSource}
          onCodeChange={setPendingSource}
          shaderError={shaderError}
          vimMode={vimMode}
          themeName={themeName}
          fontSize={fontSize}
          onSave={handleSaveShader}
        />
      </Box>

      {/* Strudel pane – hidden but mounted when not visible to preserve state */}
      <Box sx={{
        display: showStrudel ? 'flex' : 'none',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
      }}>
        <StrudelPane
          ref={strudelRef}
          onAnalyserReady={setStrudelAnalyser}
          onAudioStreamReady={setStrudelAudioStream}
          vimMode={vimMode}
          themeName={themeName}
          volume={volume}
          muted={muted}
          fontSize={fontSize}
          onSave={handleSavePattern}
        />
      </Box>

      {/* Buffer A (iChannel3) – hidden but mounted when not visible to preserve state */}
      <Box sx={{
        display: showBuffer3 ? 'flex' : 'none',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
      }}>
        <BufferEditorPane
          label="Buffer A"
          channelName="iChannel3"
          initialCode={initialBuffer3Code}
          onRun={handleRunBuffer3}
          pendingSource={pendingBuffer3}
          onCodeChange={setPendingBuffer3}
          onSave={saveBuffer3Code}
          shaderError={shaderError}
          vimMode={vimMode}
          themeName={themeName}
          fontSize={fontSize}
        />
      </Box>

      {/* Buffer B (iChannel4) – hidden but mounted when not visible to preserve state */}
      <Box sx={{
        display: showBuffer4 ? 'flex' : 'none',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
      }}>
        <BufferEditorPane
          label="Buffer B"
          channelName="iChannel4"
          initialCode={initialBuffer4Code}
          onRun={handleRunBuffer4}
          pendingSource={pendingBuffer4}
          onCodeChange={setPendingBuffer4}
          onSave={saveBuffer4Code}
          shaderError={shaderError}
          vimMode={vimMode}
          themeName={themeName}
          fontSize={fontSize}
        />
      </Box>

      {/* Buffer C (iChannel6) – hidden but mounted when not visible to preserve state */}
      <Box sx={{
        display: showBuffer6 ? 'flex' : 'none',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
      }}>
        <BufferEditorPane
          label="Buffer C"
          channelName="iChannel6"
          initialCode={initialBuffer6Code}
          onRun={handleRunBuffer6}
          pendingSource={pendingBuffer6}
          onCodeChange={setPendingBuffer6}
          onSave={saveBuffer6Code}
          shaderError={shaderError}
          vimMode={vimMode}
          themeName={themeName}
          fontSize={fontSize}
        />
      </Box>
    </Box>
  )

  // ── Render ─────────────────────────────────────────────────────────────────

  // Overwrite dialog – shared across all layout renders
  const overwriteDialog = (
    <Dialog
      open={overwriteDialogOpen}
      onClose={handleOverwriteCancel}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'var(--pg-bg-header)',
          color: 'var(--pg-text-primary)',
          border: '1px solid var(--pg-border-default)',
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Typography variant="h6" sx={{ fontFamily: 'monospace', fontSize: '1rem', color: 'var(--pg-text-primary)' }}>
          Overwrite entry?
        </Typography>
        <IconButton size="small" onClick={handleOverwriteCancel} aria-label="Close dialog" sx={{ color: 'var(--pg-text-muted)' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 0 }}>
        <Typography variant="body2" sx={{ color: 'var(--pg-text-muted)', fontFamily: 'monospace', mb: 1.5 }}>
          A saved entry named <strong style={{ color: 'var(--pg-accent)' }}>{overwritePending?.title}</strong> already exists. Saving will overwrite it.
        </Typography>
        <FormControlLabel
          control={
            <Checkbox
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              size="small"
              sx={{
                color: 'var(--pg-border-default)',
                '&.Mui-checked': { color: 'var(--pg-accent)' },
              }}
            />
          }
          label={
            <Typography variant="body2" sx={{ color: 'var(--pg-text-muted)', fontSize: '0.8rem' }}>
              Don't show this again
            </Typography>
          }
        />
      </DialogContent>
      <DialogActions sx={{ px: 2, pb: 2 }}>
        <Button
          onClick={handleOverwriteCancel}
          size="small"
          sx={{ textTransform: 'none', color: 'var(--pg-text-muted)' }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleOverwriteConfirm}
          variant="contained"
          color="primary"
          size="small"
          sx={{ textTransform: 'none' }}
        >
          Overwrite
        </Button>
      </DialogActions>
    </Dialog>
  )

  // ── Immersive mode: shader fills the viewport, editor overlays on top ─────
  if (displayMode === 'immersive') {
    return (
      <Box
        ref={outerContainerRef}
        sx={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}
      >
        {/* Layer 0 – Shader canvas, full viewport, behind everything */}
        <Box sx={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <ShaderPane
            ref={shaderRef}
            shaderSource={shaderSource}
            bufferSources={bufferSources}
            webcamStream={webcamStream}
            audioStream={audioStream}
            strudelAnalyser={strudelAnalyser}
            strudelAudioStream={strudelAudioStream}
            webcamEnabled={webcamEnabled}
            micEnabled={micEnabled}
            volume={volume}
            muted={muted}
            onToggleWebcam={handleToggleWebcam}
            onToggleMic={handleToggleMic}
            onVolumeChange={handleVolumeChange}
            onToggleMute={handleToggleMute}
            onShaderError={setShaderError}
            isMobile={isMobile}
            hideControls
            onPlayStateChange={setImmersiveShaderPlaying}
            onRecordingStateChange={setImmersiveShaderRecording}
            onFullscreenStateChange={setImmersiveShaderFullscreen}
          />
        </Box>

        {/* Layer 1 – Editor overlay + controls bar stacked in one flex column */}
        <Box sx={{ position: 'absolute', inset: 0, zIndex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Editor area – flex:1 so it fills space above the controls bar */}
          <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {tabBar}
            <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {editorContent}
            </Box>
          </Box>

          {/* Controls bar sits at the bottom and takes its natural height */}
          <ShaderControls
            isPlaying={immersiveShaderPlaying}
            isRecording={immersiveShaderRecording}
            isFullscreen={immersiveShaderFullscreen}
            webcamEnabled={webcamEnabled}
            micEnabled={micEnabled}
            strudelAnalyser={strudelAnalyser}
            volume={volume}
            muted={muted}
            onTogglePlay={() => shaderRef.current?.togglePlay()}
            onToggleWebcam={handleToggleWebcam}
            onToggleMic={handleToggleMic}
            onVolumeChange={handleVolumeChange}
            onToggleMute={handleToggleMute}
            onStartRecording={() => shaderRef.current?.startRecording()}
            onStopRecording={() => shaderRef.current?.stopRecording()}
            onToggleFullscreen={() => shaderRef.current?.toggleFullscreen()}
            isMobile={isMobile}
            isImmersive={true}
            onToggleImmersive={handleToggleImmersive}
            immersiveOpacity={immersiveOpacity}
            onImmersiveOpacityChange={setImmersiveOpacity}
          />
        </Box>
        {overwriteDialog}
      </Box>
    )
  }

  if (isMobile) {
    // Mobile: vertical stack – shader on top, editor panel below
    return (
      <Box
        ref={outerContainerRef}
        sx={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden', bgcolor: 'var(--pg-bg-app)' }}
      >
        {/* Top: shader canvas */}
        <Box sx={{ height: editorCollapsed ? '100%' : `${mobileShaderRatio}%`, flexShrink: 0, minHeight: 0 }}>
          <ShaderPane
            ref={shaderRef}
            shaderSource={shaderSource}
            bufferSources={bufferSources}
            webcamStream={webcamStream}
            audioStream={audioStream}
            strudelAnalyser={strudelAnalyser}
            strudelAudioStream={strudelAudioStream}
            webcamEnabled={webcamEnabled}
            micEnabled={micEnabled}
            volume={volume}
            muted={muted}
            onToggleWebcam={handleToggleWebcam}
            onToggleMic={handleToggleMic}
            onVolumeChange={handleVolumeChange}
            onToggleMute={handleToggleMute}
            onShaderError={setShaderError}
            editorCollapsed={editorCollapsed}
            onToggleEditorCollapsed={() => setEditorCollapsed(c => !c)}
            isMobile={true}
            isImmersive={false}
            onToggleImmersive={handleToggleImmersive}
            immersiveOpacity={immersiveOpacity}
            onImmersiveOpacityChange={setImmersiveOpacity}
          />
        </Box>

        {/* Horizontal drag divider */}
        {!editorCollapsed && (
          <Box
            onMouseDown={handleMobileDividerMouseDown}
            sx={{
              height: '4px',
              cursor: 'row-resize',
              bgcolor: 'var(--pg-divider-default)',
              flexShrink: 0,
              '&:hover': { bgcolor: 'var(--pg-divider-hover)' },
            }}
          />
        )}

        {/* Bottom: editor panel */}
        <Collapse in={!editorCollapsed} sx={mobileEditorCollapseSx}>
          <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            {tabBar}
            {editorContent}
          </Box>
        </Collapse>
        {overwriteDialog}
      </Box>
    )
  }

  // Desktop: horizontal layout – shader on left, editor on right
  return (
    <Box ref={outerContainerRef} sx={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', bgcolor: 'var(--pg-bg-app)' }}>
      {/* Left: shader canvas */}
      <Box sx={{ width: editorCollapsed ? '100%' : `${leftRatio}%`, minWidth: 0, flexShrink: 0 }}>
        <ShaderPane
          ref={shaderRef}
          shaderSource={shaderSource}
          bufferSources={bufferSources}
          webcamStream={webcamStream}
          audioStream={audioStream}
          strudelAnalyser={strudelAnalyser}
          strudelAudioStream={strudelAudioStream}
          webcamEnabled={webcamEnabled}
          micEnabled={micEnabled}
          volume={volume}
          muted={muted}
          onToggleWebcam={handleToggleWebcam}
          onToggleMic={handleToggleMic}
          onVolumeChange={handleVolumeChange}
          onToggleMute={handleToggleMute}
          onShaderError={setShaderError}
          editorCollapsed={editorCollapsed}
          onToggleEditorCollapsed={() => setEditorCollapsed(c => !c)}
          isMobile={false}
          isImmersive={false}
          onToggleImmersive={handleToggleImmersive}
          immersiveOpacity={immersiveOpacity}
          onImmersiveOpacityChange={setImmersiveOpacity}
        />
      </Box>

      {/* Horizontal drag divider between shader and editor */}
      {!editorCollapsed && (
        <Box
          onMouseDown={handleHorizontalDividerMouseDown}
          sx={{
            width: '4px',
            cursor: 'col-resize',
            bgcolor: 'var(--pg-divider-default)',
            flexShrink: 0,
            '&:hover': { bgcolor: 'var(--pg-divider-hover)' },
          }}
        />
      )}

      {/* Right: editor panel */}
      <Collapse orientation="horizontal" in={!editorCollapsed} sx={desktopEditorCollapseSx}>
        <Box sx={{ width: '100%', minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
          {tabBar}
          {editorContent}
        </Box>
      </Collapse>

      {overwriteDialog}
    </Box>
  )
}

