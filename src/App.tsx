import { useState, useCallback, useEffect, useRef } from 'react'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import CodeIcon from '@mui/icons-material/Code'
import SettingsIcon from '@mui/icons-material/Settings'
import ShaderPane, { type ShaderPaneHandle } from './components/ShaderPane'
import EditorPane, { type EditorPaneHandle } from './components/EditorPane'
import StrudelPane, { type StrudelPaneHandle } from './components/StrudelPane'
import SettingsPane from './components/SettingsPane'
import CombinedExamplesPanel from './components/CombinedExamplesPanel'
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

type ViewMode = 'glsl' | 'strudel' | 'split' | 'examples'

// Shared SX for top-bar toggle buttons (issue 13)
const tabButtonSx = {
  color: 'var(--pg-text-button)',
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

export default function App() {
  const [shaderSource, setShaderSource] = useState<string>(initialShaderCode)
  const [pendingSource, setPendingSource] = useState<string>(initialShaderCode)
  const [shaderError, setShaderError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('glsl')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [strudelAnalyser, setStrudelAnalyser] = useState<AnalyserNode | null>(null)
  const [strudelAudioStream, setStrudelAudioStream] = useState<MediaStream | null>(null)
  const [splitRatio, setSplitRatio] = useState(50)
  const [leftRatio, setLeftRatio] = useState(50)
  const [vimMode, setVimMode] = useState<boolean>(() => localStorage.getItem(LS_VIM_MODE) === 'true')
  const [themeName, setThemeName] = useState<string>(() => localStorage.getItem(LS_THEME) ?? 'kanagawa')
  // Shared vim status for the single bar shown in split mode
  const [vimStatus, setVimStatus] = useState('')
  const outerContainerRef = useRef<HTMLDivElement>(null)
  const rightPanelRef = useRef<HTMLDivElement>(null)
  const strudelRef = useRef<StrudelPaneHandle>(null)
  const editorRef = useRef<EditorPaneHandle>(null)
  const shaderRef = useRef<ShaderPaneHandle>(null)
  // Keep a ref to pendingSource for the global keydown handler (avoids stale closure)
  const pendingSourceRef = useRef(pendingSource)
  pendingSourceRef.current = pendingSource

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
      // Ctrl+Enter / Cmd+Enter → Play Shader (run/compile)
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        e.stopPropagation()
        setShaderSource(pendingSourceRef.current)
        return
      }
      // Ctrl+. / Cmd+. → Pause Shader (freeze animation)
      if ((e.ctrlKey || e.metaKey) && e.key === '.') {
        e.preventDefault()
        e.stopPropagation()
        shaderRef.current?.pause()
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

  // Examples loading callbacks – called by CombinedExamplesPanel
  const handleLoadGlslExample = useCallback((title: string, content: string) => {
    editorRef.current?.loadExample(title, content)
    setViewMode('glsl')
    setSettingsOpen(false)
  }, [])

  const handleLoadStrudelExample = useCallback((title: string, content: string) => {
    strudelRef.current?.loadExample(title, content)
    setViewMode('strudel')
    setSettingsOpen(false)
  }, [])

  const isSplit = viewMode === 'split'
  const showGlsl = !settingsOpen && (viewMode === 'glsl' || isSplit)
  const showStrudel = !settingsOpen && (viewMode === 'strudel' || isSplit)

  return (
    <Box ref={outerContainerRef} sx={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', bgcolor: 'var(--pg-bg-app)' }}>
      {/* Left: shader canvas */}
      <Box sx={{ width: `${leftRatio}%`, minWidth: 0, flexShrink: 0 }}>
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

      {/* Right: editor panel */}
      <Box ref={rightPanelRef} sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Top tab bar */}
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
            value={settingsOpen ? null : viewMode}
            exclusive
            onChange={(_e, val: ViewMode | null) => {
              if (val) { setViewMode(val); setSettingsOpen(false) }
            }}
            size="small"
            sx={{ flex: 1 }}
          >
            <ToggleButton value="glsl" sx={tabButtonSx}>GLSL</ToggleButton>
            <ToggleButton value="strudel" sx={tabButtonSx}>Strudel</ToggleButton>
            <ToggleButton value="split" sx={tabButtonSx}>Split</ToggleButton>
            <ToggleButton value="examples" sx={tabButtonSx}>Examples</ToggleButton>
          </ToggleButtonGroup>

          {/* Settings and Source buttons grouped on the right */}
          <Tooltip title={settingsOpen ? 'Close settings' : 'Settings'}>
            <IconButton
              size="small"
              onClick={() => setSettingsOpen(v => !v)}
              aria-label="Settings"
              sx={{
                color: settingsOpen ? 'var(--pg-accent)' : 'var(--pg-text-primary)',
                '&:hover': { color: 'var(--pg-accent)' },
              }}
            >
              <SettingsIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="View source (AGPL)">
            <IconButton
              component="a"
              href="https://github.com/tass-suderman/webgl-shader-playground"
              target="_blank"
              rel="noopener noreferrer"
              size="small"
              sx={{ color: 'var(--pg-text-primary)', '&:hover': { color: '#fff' } }}
              aria-label="View source on GitHub"
            >
              <CodeIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Editor area */}
        <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          {/* Settings panel – overlays the editor area */}
          {settingsOpen && (
            <SettingsPane
              vimMode={vimMode}
              onVimModeChange={handleVimModeChange}
              themeName={themeName}
              onThemeChange={handleThemeChange}
            />
          )}

          {/* Examples panel (combined GLSL + Strudel) */}
          {!settingsOpen && viewMode === 'examples' && (
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
              showVimBar={!isSplit}
              onVimStatusChange={isSplit ? setVimStatus : undefined}
            />
          </Box>

          {/* Drag divider (split mode only) */}
          {!settingsOpen && isSplit && (
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
              showVimBar={!isSplit}
              onVimStatusChange={isSplit ? setVimStatus : undefined}
            />
          </Box>

          {/* Single vim status bar shown below both panes in split mode */}
          {!settingsOpen && isSplit && vimMode && (
            <Box
              sx={{
                px: 1,
                py: 0.25,
                bgcolor: 'var(--pg-bg-header)',
                color: 'var(--pg-text-primary)',
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                borderTop: '1px solid var(--pg-border-subtle)',
                flexShrink: 0,
                minHeight: '1.5rem',
              }}
            >
              {vimStatus}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  )
}
