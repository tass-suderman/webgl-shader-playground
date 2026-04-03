import { useState, useCallback, useRef } from 'react'
import Box from '@mui/material/Box'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import ShaderPane from './components/ShaderPane'
import EditorPane from './components/EditorPane'
import StrudelPane from './components/StrudelPane'
import { DEFAULT_SHADER } from './shaders/default'

type ViewMode = 'glsl' | 'strudel' | 'split'

export default function App() {
  const [shaderSource, setShaderSource] = useState<string>(DEFAULT_SHADER)
  const [pendingSource, setPendingSource] = useState<string>(DEFAULT_SHADER)
  const [webcamEnabled, setWebcamEnabled] = useState(false)
  const [micEnabled, setMicEnabled] = useState(false)
  const [systemAudioEnabled, setSystemAudioEnabled] = useState(false)
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null)
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null)
  const [shaderError, setShaderError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('glsl')
  const [strudelAnalyser, setStrudelAnalyser] = useState<AnalyserNode | null>(null)
  const [splitRatio, setSplitRatio] = useState(50)
  const rightPanelRef = useRef<HTMLDivElement>(null)

  const handleRun = useCallback((code: string) => {
    setShaderSource(code)
  }, [])

  const handleToggleWebcam = useCallback(async () => {
    if (webcamEnabled) {
      if (webcamStream) {
        webcamStream.getTracks().forEach(t => t.stop())
        setWebcamStream(null)
      }
      setWebcamEnabled(false)
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        // Stop webcam when the track ends (e.g. user revokes permission)
        stream.getVideoTracks().forEach(track => {
          track.onended = () => {
            setWebcamStream(null)
            setWebcamEnabled(false)
          }
        })
        setWebcamStream(stream)
        setWebcamEnabled(true)
      } catch (e) {
        console.error('Failed to get webcam:', e)
      }
    }
  }, [webcamEnabled, webcamStream])

  const stopAudio = useCallback(() => {
    if (audioStream) {
      audioStream.getTracks().forEach(t => t.stop())
      setAudioStream(null)
    }
    setMicEnabled(false)
    setSystemAudioEnabled(false)
  }, [audioStream])

  const handleToggleMic = useCallback(async () => {
    if (micEnabled) {
      stopAudio()
    } else {
      // Stop any existing audio source first
      if (audioStream) {
        audioStream.getTracks().forEach(t => t.stop())
        setAudioStream(null)
      }
      setSystemAudioEnabled(false)
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        stream.getAudioTracks().forEach(track => {
          track.onended = () => {
            setAudioStream(null)
            setMicEnabled(false)
          }
        })
        setAudioStream(stream)
        setMicEnabled(true)
      } catch (e) {
        console.error('Failed to get mic:', e)
      }
    }
  }, [micEnabled, audioStream, stopAudio])

  const handleToggleSystemAudio = useCallback(async () => {
    if (systemAudioEnabled) {
      stopAudio()
    } else {
      // Stop any existing audio source first
      if (audioStream) {
        audioStream.getTracks().forEach(t => t.stop())
        setAudioStream(null)
      }
      setMicEnabled(false)
      try {
        // getDisplayMedia is the only browser API that can capture system audio output.
        // Most browsers require video:true even when only audio is needed.
        // Note: browser support and user-facing dialogs vary – Chrome shows a tab/window
        // picker with an "also share audio" checkbox, Firefox may not support system audio.
        const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
        const audioTracks = displayStream.getAudioTracks()
        if (audioTracks.length === 0) {
          // No audio was shared – stop everything and bail out
          displayStream.getTracks().forEach(t => t.stop())
          console.warn('No system audio track found. Make sure to enable audio sharing in the dialog.')
          return
        }
        // Stop the video capture immediately – we only need the audio
        displayStream.getVideoTracks().forEach(t => t.stop())
        // Build a new stream that contains only the audio tracks
        const audioOnlyStream = new MediaStream(audioTracks)
        audioTracks.forEach(track => {
          track.onended = () => {
            setAudioStream(null)
            setSystemAudioEnabled(false)
          }
        })
        setAudioStream(audioOnlyStream)
        setSystemAudioEnabled(true)
      } catch (e) {
        console.error('Failed to get system audio:', e)
      }
    }
  }, [systemAudioEnabled, audioStream, stopAudio])

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

  return (
    <Box sx={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', bgcolor: '#1a1a2e' }}>
      {/* Left: shader canvas */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <ShaderPane
          shaderSource={shaderSource}
          webcamStream={webcamStream}
          audioStream={audioStream}
          strudelAnalyser={strudelAnalyser}
          webcamEnabled={webcamEnabled}
          micEnabled={micEnabled}
          systemAudioEnabled={systemAudioEnabled}
          onToggleWebcam={handleToggleWebcam}
          onToggleMic={handleToggleMic}
          onToggleSystemAudio={handleToggleSystemAudio}
          onShaderError={setShaderError}
        />
      </Box>

      {/* Right: editor panel */}
      <Box ref={rightPanelRef} sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Tab bar */}
        <Box sx={{ px: 1, py: 0.5, bgcolor: '#1e1e1e', borderBottom: '1px solid rgba(255,255,255,0.1)', flexShrink: 0, display: 'flex' }}>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_e, val: ViewMode | null) => { if (val) setViewMode(val) }}
            size="small"
          >
            <ToggleButton value="glsl" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', py: 0.25, px: 1.5, textTransform: 'none' }}>
              GLSL
            </ToggleButton>
            <ToggleButton value="strudel" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', py: 0.25, px: 1.5, textTransform: 'none' }}>
              Strudel
            </ToggleButton>
            <ToggleButton value="split" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', py: 0.25, px: 1.5, textTransform: 'none' }}>
              Split
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Editor area */}
        <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          {/* GLSL editor – hidden but mounted when not visible to preserve state */}
          <Box sx={{
            display: viewMode === 'split' ? 'flex' : (viewMode === 'glsl' ? 'flex' : 'none'),
            flexDirection: 'column',
            height: viewMode === 'split' ? `${splitRatio}%` : '100%',
            minHeight: 0,
          }}>
            <EditorPane
              initialCode={DEFAULT_SHADER}
              onRun={handleRun}
              pendingSource={pendingSource}
              onCodeChange={setPendingSource}
              shaderError={shaderError}
            />
          </Box>

          {/* Drag divider (split mode only) */}
          {viewMode === 'split' && (
            <Box
              onMouseDown={handleDividerMouseDown}
              sx={{
                height: '4px',
                bgcolor: 'rgba(255,255,255,0.15)',
                cursor: 'row-resize',
                flexShrink: 0,
                '&:hover': { bgcolor: 'rgba(255,255,255,0.35)' },
              }}
            />
          )}

          {/* Strudel pane – hidden but mounted when not visible to preserve state */}
          <Box sx={{
            display: viewMode === 'split' ? 'flex' : (viewMode === 'strudel' ? 'flex' : 'none'),
            flexDirection: 'column',
            height: viewMode === 'split' ? `calc(${100 - splitRatio}% - 4px)` : '100%',
            minHeight: 0,
          }}>
            <StrudelPane onAnalyserReady={setStrudelAnalyser} />
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
