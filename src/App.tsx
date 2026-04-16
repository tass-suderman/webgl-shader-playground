import { useState, useCallback, useEffect, useRef } from 'react'
import { GlobalStyles, ThemeProvider } from '@mui/material'
import useMediaQuery from '@mui/material/useMediaQuery'
import { type ShaderPaneHandle } from './components/shader/ShaderPane'
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
import { ImmersiveView } from './views/ImmersiveView'
import { MobileView } from './views/MobileView'
import { DesktopView } from './views/DesktopView'
import { OverwriteDialog } from './components/dialog/OverwriteDialog'

type DisplayMode = 'default' | 'immersive'

// Computed once at module load – used to seed the initial shader state so the
// last-saved shader is both displayed in the editor and running on the GPU
// without waiting for a user action.
const initialShaderCode = getInitialGlslCode()


export default function App() {
  const [shaderSource, setShaderSource] = useState<string>(initialShaderCode)
  const [shaderError, setShaderError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('glsl')
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

  /** Horizontal divider between shader (top) and editor (bottom) on mobile */

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
	//
	const overwriteDialog = (
		<OverwriteDialog
			overwriteDialogOpen={overwriteDialogOpen}
			overwritePending={overwritePending}
			dontShowAgain={dontShowAgain}
			setDontShowAgain={setDontShowAgain}
			handleOverwriteConfirm={handleOverwriteConfirm}
			handleOverwriteCancel={handleOverwriteCancel}
		/>
	)


	// ── Render ─────────────────────────────────────────────────────────────────
	const viewTypeDisplay = 
		displayMode === 'immersive' ? (
			<ImmersiveView
				shaderSource={shaderSource}
				webcamStream={webcamStream}
				audioStream={audioStream}
				webcamEnabled={webcamEnabled}
				micEnabled={micEnabled}
				handleToggleWebcam={handleToggleWebcam}
				handleToggleMic={handleToggleMic}
				handleVolumeChange={handleVolumeChange}
				handleToggleMute={handleToggleMute}
				setShaderError={setShaderError}
				immersiveShaderPlaying={immersiveShaderPlaying}
				setImmersiveShaderPlaying={setImmersiveShaderPlaying}
				immersiveShaderRecording={immersiveShaderRecording}
				setImmersiveShaderRecording={setImmersiveShaderRecording}
				immersiveShaderFullscreen={immersiveShaderFullscreen}
				setImmersiveShaderFullscreen={setImmersiveShaderFullscreen}
				handleToggleImmersive={handleToggleImmersive}
				immersiveOpacity={immersiveOpacity}
				setImmersiveOpacity={setImmersiveOpacity}
				isMobile={isMobile}
				outerContainerRef={outerContainerRef}
				shaderRef={shaderRef}
				tabBar={tabBar}
				editorContent={editorContent}
				overwriteDialog={overwriteDialog}
			/>
		) : isMobile ? (
			<MobileView
				shaderSource={shaderSource}
				webcamStream={webcamStream}
				audioStream={audioStream}
				webcamEnabled={webcamEnabled}
				micEnabled={micEnabled}
				handleToggleWebcam={handleToggleWebcam}
				handleToggleMic={handleToggleMic}
				handleVolumeChange={handleVolumeChange}
				handleToggleMute={handleToggleMute}
				setShaderError={setShaderError}
				handleToggleImmersive={handleToggleImmersive}
				immersiveOpacity={immersiveOpacity}
				setImmersiveOpacity={setImmersiveOpacity}
				editorCollapsed={editorCollapsed}
				setEditorCollapsed={setEditorCollapsed}
				outerContainerRef={outerContainerRef}
				shaderRef={shaderRef}
				tabBar={tabBar}
				editorContent={editorContent}
				overwriteDialog={overwriteDialog}
			/>
    ) : (
			<DesktopView
				shaderSource={shaderSource}
				webcamStream={webcamStream}
				audioStream={audioStream}
				webcamEnabled={webcamEnabled}
				micEnabled={micEnabled}
				handleToggleWebcam={handleToggleWebcam}
				handleToggleMic={handleToggleMic}
				handleVolumeChange={handleVolumeChange}
				handleToggleMute={handleToggleMute}
				setShaderError={setShaderError}
				handleToggleImmersive={handleToggleImmersive}
				immersiveOpacity={immersiveOpacity}
				setImmersiveOpacity={setImmersiveOpacity}
				editorCollapsed={editorCollapsed}
				setEditorCollapsed={setEditorCollapsed}
				outerContainerRef={outerContainerRef}
				shaderRef={shaderRef}
				tabBar={tabBar}
				editorContent={editorContent}
				overwriteDialog={overwriteDialog}
			/>
		)

  return (
		<ThemeProvider theme={muiTheme}>
			<StrudelAnalyzerProvider>
			<StrudelAudioStreamProvider>
			<GlobalStyles styles={{
				'.MuiTypography-root': {
					color: muiTheme.palette.textColor.primary,
				},
			}} />
				{viewTypeDisplay}
			</StrudelAudioStreamProvider>
			</StrudelAnalyzerProvider>
		</ThemeProvider>
  )
}

