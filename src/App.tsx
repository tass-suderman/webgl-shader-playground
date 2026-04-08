import { useState, useCallback, useEffect, useRef } from 'react'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import useMediaQuery from '@mui/material/useMediaQuery'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ShaderPane, { type ShaderPaneHandle } from './components/ShaderPane'
import EditorPane, { type EditorPaneHandle } from './components/EditorPane'
import StrudelPane, { type StrudelPaneHandle } from './components/StrudelPane'
import SettingsPane from './components/SettingsPane'
import CombinedExamplesPanel from './components/CombinedExamplesPanel'
import AboutPane from './components/AboutPane'
import { DEFAULT_SHADER } from './shaders/default'
import { applyTheme, getThemeByName } from './themes/appThemes'
import { useMediaStreams } from './hooks/useMediaStreams'

export const LS_GLSL_CODE = 'shader-playground:glsl-code'
const LS_THEME = 'shader-playground:theme'
const LS_VIM_MODE = 'shader-playground:vim-mode'

// Computed once at module load – used to seed the initial shader state so the
// last-saved shader is both displayed in the editor and running on the GPU
// without waiting for a user action.
const initialShaderCode = localStorage.getItem(LS_GLSL_CODE) ?? DEFAULT_SHADER

type ViewMode = 'glsl' | 'strudel' | 'split' | 'examples' | 'settings' | 'about'

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

// Editor mode tabs (GLSL / Strudel / Split) – primary text colour
const editorTabSx = { ...baseTabSx, color: 'var(--pg-text-button)' } as const

// Utility tabs (Examples / Settings) – warm complementary text colour
const utilTabSx = { ...baseTabSx, color: 'var(--pg-text-util-tab)' } as const

// About tab – a second warm complementary text colour
const aboutTabSx = { ...baseTabSx, color: 'var(--pg-text-source-tab)' } as const

export default function App() {
  const [shaderSource, setShaderSource] = useState<string>(initialShaderCode)
  const [pendingSource, setPendingSource] = useState<string>(initialShaderCode)
  const [shaderError, setShaderError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('glsl')
  const [strudelAnalyser, setStrudelAnalyser] = useState<AnalyserNode | null>(null)
  const [strudelAudioStream, setStrudelAudioStream] = useState<MediaStream | null>(null)
  const [splitRatio, setSplitRatio] = useState(50)
  const [leftRatio, setLeftRatio] = useState(50)
  /** On mobile the canvas occupies this % of viewport height (editor gets the rest) */
  const [mobileShaderRatio, setMobileShaderRatio] = useState(50)
  const [editorCollapsed, setEditorCollapsed] = useState(false)
  const [vimMode, setVimMode] = useState<boolean>(() => localStorage.getItem(LS_VIM_MODE) === 'true')
  const [themeName, setThemeName] = useState<string>(() => localStorage.getItem(LS_THEME) ?? 'kanagawa')
  const outerContainerRef = useRef<HTMLDivElement>(null)
  const rightPanelRef = useRef<HTMLDivElement>(null)
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
    systemAudioEnabled,
    webcamStream,
    audioStream,
    handleToggleWebcam,
    handleToggleMic,
    handleToggleSystemAudio,
  } = useMediaStreams()

  // Apply the active theme as CSS custom properties whenever it changes
  useEffect(() => {
    applyTheme(getThemeByName(themeName))
  }, [themeName])

  // On mobile, split view is not available – fall back to glsl if selected
  useEffect(() => {
    if (isMobile && viewMode === 'split') setViewMode('glsl')
  }, [isMobile, viewMode])

  const handleThemeChange = useCallback((name: string) => {
    setThemeName(name)
    localStorage.setItem(LS_THEME, name)
  }, [])

  const handleVimModeChange = useCallback((enabled: boolean) => {
    setVimMode(enabled)
    localStorage.setItem(LS_VIM_MODE, String(enabled))
  }, [])

  const handleRun = useCallback((code: string) => {
    setShaderSource(code)
  }, [])

  // Global keyboard shortcuts (capture phase so they fire before Monaco / CodeMirror)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ctrl+Enter / Cmd+Enter → Play Shader (run/compile) and unpause if paused
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        e.stopPropagation()
        setShaderSource(pendingSourceRef.current)
        shaderRef.current?.unpause()
        return
      }
      // Ctrl+. / Cmd+. → Toggle Shader pause/unpause
      if ((e.ctrlKey || e.metaKey) && e.key === '.') {
        e.preventDefault()
        e.stopPropagation()
        shaderRef.current?.togglePlay()
        return
      }
      // Alt+Enter → Play Strudel
      if (e.altKey && e.key === 'Enter') {
        e.preventDefault()
        e.stopPropagation()
        strudelRef.current?.play()
        return
      }
      // Alt+. → Pause Strudel
      if (e.altKey && e.key === '.') {
        e.preventDefault()
        e.stopPropagation()
        strudelRef.current?.pause()
      }
    }
    window.addEventListener('keydown', handler, { capture: true })
    return () => window.removeEventListener('keydown', handler, { capture: true })
  }, [])

  // ── Divider drag handlers ──────────────────────────────────────────────────

  /** Vertical divider inside the right panel (split-view GLSL/Strudel) */
  const handleDividerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const panel = rightPanelRef.current
    if (!panel) return
    const startY = e.clientY
    const startRatio = splitRatio
    const panelH = panel.getBoundingClientRect().height
    const onMove = (me: MouseEvent) => {
      const delta = me.clientY - startY
      const newRatio = Math.min(80, Math.max(20, startRatio + (delta / panelH) * 100))
      setSplitRatio(newRatio)
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [splitRatio])

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

  // ── Derived flags ──────────────────────────────────────────────────────────

  const isSplit = viewMode === 'split'
  const showGlsl = viewMode === 'glsl' || isSplit
  const showStrudel = viewMode === 'strudel' || isSplit

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
        }}
        size="small"
        sx={{ flex: 1, minWidth: 0 }}
      >
        <ToggleButton value="glsl" sx={editorTabSx}>GLSL</ToggleButton>
        <ToggleButton value="strudel" sx={editorTabSx}>Strudel</ToggleButton>
        {/* Split view is desktop-only */}
        {!isMobile && <ToggleButton value="split" sx={editorTabSx}>Split</ToggleButton>}
        <ToggleButton value="examples" sx={utilTabSx}>Examples</ToggleButton>
        <ToggleButton value="settings" sx={utilTabSx}>Settings</ToggleButton>
        <ToggleButton value="about" sx={aboutTabSx}>About</ToggleButton>
      </ToggleButtonGroup>

      {/* Collapse / expand editor button */}
      <Tooltip title={editorCollapsed ? 'Expand Editor' : 'Collapse Editor'}>
        <IconButton
          size="small"
          onClick={() => setEditorCollapsed(c => !c)}
          aria-label={editorCollapsed ? 'Expand Editor' : 'Collapse Editor'}
          sx={{ color: 'var(--pg-text-button)', flexShrink: 0 }}
        >
          {isMobile
            ? (editorCollapsed ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />)
            : (editorCollapsed ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />)
          }
        </IconButton>
      </Tooltip>
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
        />
      )}

      {/* Examples panel (combined GLSL + Strudel) */}
      {viewMode === 'examples' && (
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <CombinedExamplesPanel
            onLoadGlsl={handleLoadGlslExample}
            onLoadStrudel={handleLoadStrudelExample}
          />
        </Box>
      )}

      {/* GLSL editor – hidden but mounted when not visible to preserve state */}
      <Box sx={{
        display: showGlsl ? 'flex' : 'none',
        flexDirection: 'column',
        height: isSplit ? `${splitRatio}%` : '100%',
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
        />
      </Box>

      {/* Drag divider (split mode only) */}
      {isSplit && (
        <Box
          onMouseDown={handleDividerMouseDown}
          sx={{
            height: '4px',
            bgcolor: 'var(--pg-divider-default)',
            cursor: 'row-resize',
            flexShrink: 0,
            '&:hover': { bgcolor: 'var(--pg-divider-hover)' },
          }}
        />
      )}

      {/* Strudel pane – hidden but mounted when not visible to preserve state */}
      <Box sx={{
        display: showStrudel ? 'flex' : 'none',
        flexDirection: 'column',
        height: isSplit ? `calc(${100 - splitRatio}% - 4px)` : '100%',
        minHeight: 0,
      }}>
        <StrudelPane
          ref={strudelRef}
          onAnalyserReady={setStrudelAnalyser}
          onAudioStreamReady={setStrudelAudioStream}
          vimMode={vimMode}
          themeName={themeName}
          isSplit={isSplit}
        />
      </Box>
    </Box>
  )

  // ── Render ─────────────────────────────────────────────────────────────────

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
            webcamStream={webcamStream}
            audioStream={audioStream}
            strudelAnalyser={strudelAnalyser}
            strudelAudioStream={strudelAudioStream}
            webcamEnabled={webcamEnabled}
            micEnabled={micEnabled}
            systemAudioEnabled={systemAudioEnabled}
            onToggleWebcam={handleToggleWebcam}
            onToggleMic={handleToggleMic}
            onToggleSystemAudio={handleToggleSystemAudio}
            onShaderError={setShaderError}
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
        {!editorCollapsed && (
          <Box ref={rightPanelRef} sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            {tabBar}
            {editorContent}
          </Box>
        )}

        {/* When collapsed show a thin bar with the expand button */}
        {editorCollapsed && (
          <Box sx={{
            px: 1,
            py: 0.5,
            bgcolor: 'var(--pg-bg-header)',
            borderTop: '1px solid var(--pg-border-subtle)',
            flexShrink: 0,
            display: 'flex',
            justifyContent: 'center',
          }}>
            <Tooltip title="Expand Editor">
              <IconButton size="small" onClick={() => setEditorCollapsed(false)} aria-label="Expand Editor" sx={{ color: 'var(--pg-text-button)' }}>
                <ExpandLessIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )}
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
          webcamStream={webcamStream}
          audioStream={audioStream}
          strudelAnalyser={strudelAnalyser}
          strudelAudioStream={strudelAudioStream}
          webcamEnabled={webcamEnabled}
          micEnabled={micEnabled}
          systemAudioEnabled={systemAudioEnabled}
          onToggleWebcam={handleToggleWebcam}
          onToggleMic={handleToggleMic}
          onToggleSystemAudio={handleToggleSystemAudio}
          onShaderError={setShaderError}
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
      {!editorCollapsed && (
        <Box ref={rightPanelRef} sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          {tabBar}
          {editorContent}
        </Box>
      )}

      {/* When collapsed show a thin bar with the expand button */}
      {editorCollapsed && (
        <Box sx={{
          width: '28px',
          bgcolor: 'var(--pg-bg-header)',
          borderLeft: '1px solid var(--pg-border-subtle)',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Tooltip title="Expand Editor">
            <IconButton size="small" onClick={() => setEditorCollapsed(false)} aria-label="Expand Editor" sx={{ color: 'var(--pg-text-button)' }}>
              <ChevronRightIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </Box>
  )
}

