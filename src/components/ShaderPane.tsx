import { useRef, useState, useCallback, useEffect } from 'react'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Chip from '@mui/material/Chip'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import PauseIcon from '@mui/icons-material/Pause'
import FullscreenIcon from '@mui/icons-material/Fullscreen'
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit'
import VideocamIcon from '@mui/icons-material/Videocam'
import VideocamOffIcon from '@mui/icons-material/VideocamOff'
import MicIcon from '@mui/icons-material/Mic'
import MicOffIcon from '@mui/icons-material/MicOff'
import VolumeUpIcon from '@mui/icons-material/VolumeUp'
import VolumeOffIcon from '@mui/icons-material/VolumeOff'
import { useWebGL } from '../hooks/useWebGL'

interface ShaderPaneProps {
  shaderSource: string
  webcamStream: MediaStream | null
  audioStream: MediaStream | null
  strudelAnalyser?: AnalyserNode | null
  webcamEnabled: boolean
  micEnabled: boolean
  systemAudioEnabled: boolean
  onToggleWebcam: () => void
  onToggleMic: () => void
  onToggleSystemAudio: () => void
  onShaderError?: (error: string | null) => void
}

export default function ShaderPane({
  shaderSource,
  webcamStream,
  audioStream,
  strudelAnalyser,
  webcamEnabled,
  micEnabled,
  systemAudioEnabled,
  onToggleWebcam,
  onToggleMic,
  onToggleSystemAudio,
  onShaderError,
}: ShaderPaneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useWebGL(canvasRef, {
    shaderSource,
    webcamStream,
    audioStream,
    strudelAnalyser,
    isPlaying,
    onError: onShaderError,
  })

  const handleFullscreen = useCallback(() => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }, [])

  useEffect(() => {
    const handleFSChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFSChange)
    return () => document.removeEventListener('fullscreenchange', handleFSChange)
  }, [])

  const audioLabel = systemAudioEnabled ? 'System Audio' : 'Mic'

  return (
    <Box
      ref={containerRef}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: '#000',
        position: 'relative',
      }}
    >
      {/* Canvas fills pane */}
      <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: '100%', display: 'block' }}
        />
      </Box>

      {/* Controls bar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 1,
          py: 0.5,
          bgcolor: 'rgba(0,0,0,0.8)',
          borderTop: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <Tooltip title={isPlaying ? 'Pause' : 'Play'}>
          <IconButton
            onClick={() => setIsPlaying(p => !p)}
            size="small"
            sx={{ color: 'white' }}
          >
            {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
          </IconButton>
        </Tooltip>

        <Tooltip title={webcamEnabled ? 'Disable Webcam (iChannel0)' : 'Enable Webcam (iChannel0)'}>
          <IconButton
            onClick={onToggleWebcam}
            size="small"
            sx={{ color: webcamEnabled ? 'primary.main' : 'white' }}
          >
            {webcamEnabled ? <VideocamIcon /> : <VideocamOffIcon />}
          </IconButton>
        </Tooltip>

        <Tooltip title={micEnabled ? 'Disable Microphone (iChannel1)' : 'Enable Microphone (iChannel1)'}>
          <IconButton
            onClick={onToggleMic}
            size="small"
            sx={{ color: micEnabled ? 'primary.main' : 'white' }}
          >
            {micEnabled ? <MicIcon /> : <MicOffIcon />}
          </IconButton>
        </Tooltip>

        <Tooltip title={systemAudioEnabled ? 'Disable System Audio (iChannel1)' : 'Enable System Audio Output (iChannel1)'}>
          <IconButton
            onClick={onToggleSystemAudio}
            size="small"
            sx={{ color: systemAudioEnabled ? 'secondary.main' : 'white' }}
          >
            {systemAudioEnabled ? <VolumeUpIcon /> : <VolumeOffIcon />}
          </IconButton>
        </Tooltip>

        {webcamEnabled && (
          <Chip
            label="iChannel0: Webcam"
            size="small"
            color="primary"
            variant="outlined"
            sx={{ fontSize: '0.65rem' }}
          />
        )}
        {(micEnabled || systemAudioEnabled) && (
          <Chip
            label={`iChannel1: ${audioLabel}`}
            size="small"
            color={systemAudioEnabled ? 'secondary' : 'primary'}
            variant="outlined"
            sx={{ fontSize: '0.65rem' }}
          />
        )}
        {strudelAnalyser && (
          <Chip
            label="iChannel2: Strudel"
            size="small"
            color="success"
            variant="outlined"
            sx={{ fontSize: '0.65rem' }}
          />
        )}

        <Box sx={{ flex: 1 }} />

        <Tooltip title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
          <IconButton
            onClick={handleFullscreen}
            size="small"
            sx={{ color: 'white' }}
          >
            {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  )
}
