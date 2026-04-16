import { useState, useCallback, useEffect, useRef } from 'react'
import { Box, Button, Checkbox, Collapse, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, GlobalStyles, IconButton, ThemeProvider, Typography } from '@mui/material'
import { Close } from '@mui/icons-material'
import useMediaQuery from '@mui/material/useMediaQuery'
import type { SxProps, Theme } from '@mui/material/styles'
import ShaderPane, { type ShaderPaneHandle } from './components/shader/ShaderPane'
import ShaderControls from './components/shader/ShaderControls'
import { type StrudelPaneHandle } from './components/strudel/StrudelPane'
import { useMediaStreams } from './hooks/useMediaStreams'
import { useAppStorage, getInitialGlslCode } from './hooks/useAppStorage'
import { useSavedContent } from './hooks/useSavedContent'
import { useTheme } from './hooks/useTheme'
import { TabBar } from './components/header/TabBar'
import { type ViewMode } from './constants/tabConfigs'
import { EditorContent } from './components/editor/EditorContent'
import { StrudelAnalyzerProvider } from './hooks/useStrudelAnalyzer'
import { StrudelAudioStreamProvider } from './hooks/useStrudelAudioStream'

type DisplayMode = 'default' | 'immersive'

// Computed once at module load – used to seed the initial shader state so the
// last-saved shader is both displayed in the editor and running on the GPU
// without waiting for a user action.
const initialShaderCode = getInitialGlslCode()


export default function App() {
  const [shaderSource, setShaderSource] = useState<string>(initialShaderCode)
  const [shaderError, setShaderError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('glsl')
  const [leftRatio, setLeftRatio] = useState(50)
  /** On mobile the canvas occupies this % of viewport height (editor gets the rest) */
  const [mobileShaderRatio, setMobileShaderRatio] = useState(50)
  const [editorCollapsed, setEditorCollapsed] = useState(false)
  const {
    vimMode, setVimMode,
		setVolume,
    muted, setMuted,
    immersiveOpacity, setImmersiveOpacity,
    fontSize, setFontSize,
    warnOnOverwrite, setWarnOnOverwrite,
  } = useAppStorage()
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
  const shaderRef = useRef<ShaderPaneHandle>(null)

  /** True when the viewport is narrow enough to be considered a phone/small device */
  const isMobile = useMediaQuery('(max-width: 600px)')
	
	const { muiTheme, changeTheme } = useTheme();
  const savedContent = useSavedContent()

  const {
    webcamEnabled,
    micEnabled,
    webcamStream,
    audioStream,
    handleToggleWebcam,
    handleToggleMic,
  } = useMediaStreams()

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

  const handleThemeChange = ((name: string) => {
		changeTheme(name)
  })

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

  // Global keyboard shortcuts (capture phase so they fire before Monaco / CodeMirror)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
			const handleKeyboardEvent = (e: KeyboardEvent, keyboardAction: () => void) => {
				e.preventDefault()
				e.stopPropagation()
				keyboardAction()
			}

      // Ctrl+Enter / Cmd+Enter → Play Shader (run/compile) and unpause if paused
			// // TODO --> This is not working for compiling the shader right now
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

  // ── Save flow with optional overwrite confirmation ─────────────────────────

  const commitSave = useCallback((title: string, content: string, type: 'shader' | 'pattern') => {
    if (type === 'shader') {
      savedContent.saveShader(title, content)
    } else {
      savedContent.savePattern(title, content)
    }
  }, [savedContent])

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
		<TabBar viewMode={viewMode} setViewMode={setViewMode} strudelRef={strudelRef} />
	)


  // ── Editor content area (shared between mobile and desktop) ───────────────
	const editorContent = (
		<EditorContent
			viewMode={viewMode}
			vimMode={vimMode}
			fontSize={fontSize}
			warnOnOverwrite={warnOnOverwrite}
			initialShaderCode={initialShaderCode}
			shaderError={shaderError}
			strudelRef={strudelRef}
			handleVimModeChange={handleVimModeChange}
			handleThemeChange={handleThemeChange}
			setFontSize={setFontSize}
			setWarnOnOverwrite={setWarnOnOverwrite}
			setShaderSource={setShaderSource}
			setViewMode={setViewMode}
			setOverwritePending={setOverwritePending}
			setOverwriteDialogOpen={setOverwriteDialogOpen}
			setDontShowAgain={setDontShowAgain}
			commitSave={commitSave}
		/>
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
          bgcolor: 'background.header',
          color: 'textColor.primary',
          border: '1px solid',
					borderColor: 'border.default',
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Typography variant="h6" sx={{ fontFamily: 'monospace', fontSize: '1rem' }}>
          Overwrite entry?
        </Typography>
        <IconButton size="small" onClick={handleOverwriteCancel} aria-label="Close dialog" sx={{ color: 'textColor.muted' }}>
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 0 }}>
        <Typography variant="body2" sx={{ color: 'textColor.muted', fontFamily: 'monospace', mb: 1.5 }}>
          A saved entry named <strong style={{ color: 'accent' }}>{overwritePending?.title}</strong> already exists. Saving will overwrite it.
        </Typography>
        <FormControlLabel
          control={
            <Checkbox
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              size="small"
              sx={{
                color: 'border.default',
                '&.Mui-checked': { color: 'accent' },
              }}
            />
          }
          label={
            <Typography variant="body2" sx={{ color: 'textColor.muted', fontSize: '0.8rem' }}>
              Don't show this again
            </Typography>
          }
        />
      </DialogContent>
      <DialogActions sx={{ px: 2, pb: 2 }}>
        <Button
          onClick={handleOverwriteCancel}
          size="small"
          sx={{ textTransform: 'none', color: 'textColor.muted' }}
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
            webcamStream={webcamStream}
            audioStream={audioStream}
            webcamEnabled={webcamEnabled}
            micEnabled={micEnabled}
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
						{editorContent}
          </Box>

          {/* Controls bar sits at the bottom and takes its natural height */}
          <ShaderControls
            isPlaying={immersiveShaderPlaying}
            isRecording={immersiveShaderRecording}
            isFullscreen={immersiveShaderFullscreen}
            webcamEnabled={webcamEnabled}
            micEnabled={micEnabled}
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
        sx={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden', bgcolor: 'background.app' }}
      >
        {/* Top: shader canvas */}
        <Box sx={{ height: editorCollapsed ? '100%' : `${mobileShaderRatio}%`, flexShrink: 0, minHeight: 0 }}>
          <ShaderPane
            ref={shaderRef}
            shaderSource={shaderSource}
            webcamStream={webcamStream}
            audioStream={audioStream}
            webcamEnabled={webcamEnabled}
            micEnabled={micEnabled}
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
              bgcolor: 'border.faint',
              flexShrink: 0,
              '&:hover': { bgcolor: 'border.hover' },
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
		<ThemeProvider theme={muiTheme}>
			<StrudelAnalyzerProvider>
			<StrudelAudioStreamProvider>
			<GlobalStyles styles={{
				'.MuiTypography-root': {
					color: muiTheme.palette.textColor.primary,
				},
			}} />
			<Box ref={outerContainerRef} sx={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', bgcolor: 'background.app' }}>
				{/* Left: shader canvas */}
				<Box sx={{ width: editorCollapsed ? '100%' : `${leftRatio}%`, minWidth: 0, flexShrink: 0 }}>
					<ShaderPane
						ref={shaderRef}
						shaderSource={shaderSource}
						webcamStream={webcamStream}
						audioStream={audioStream}
						webcamEnabled={webcamEnabled}
						micEnabled={micEnabled}
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
							bgcolor: 'border.default',
							flexShrink: 0,
							'&:hover': { bgcolor: 'border.faint'},
						}}
					/>
				)}

				{/* Right: editor panel */}
				<Collapse orientation="horizontal" in={!editorCollapsed} sx={desktopEditorCollapseSx}>
					<Box sx={{ flex: 1, height: '100%', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
						{tabBar}
						{editorContent}
					</Box>
				</Collapse>

				{overwriteDialog}
			</Box>
			</StrudelAudioStreamProvider>
			</StrudelAnalyzerProvider>
		</ThemeProvider>
  )
}

