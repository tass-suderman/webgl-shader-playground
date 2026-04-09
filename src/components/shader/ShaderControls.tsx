import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Slider from '@mui/material/Slider'
import Tooltip from '@mui/material/Tooltip'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import PauseIcon from '@mui/icons-material/Pause'
import FullscreenIcon from '@mui/icons-material/Fullscreen'
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit'
import VideocamIcon from '@mui/icons-material/Videocam'
import VideocamOffIcon from '@mui/icons-material/VideocamOff'
import MicIcon from '@mui/icons-material/Mic'
import MicOffIcon from '@mui/icons-material/MicOff'
import VolumeUpIcon from '@mui/icons-material/VolumeUp'
import VolumeDownIcon from '@mui/icons-material/VolumeDown'
import VolumeOffIcon from '@mui/icons-material/VolumeOff'
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord'
import StopCircleIcon from '@mui/icons-material/StopCircle'
import ChannelStatusChips from './ChannelStatusChips'

interface ShaderControlsProps {
  isPlaying: boolean
  isRecording: boolean
  isFullscreen: boolean
  webcamEnabled: boolean
  micEnabled: boolean
  systemAudioEnabled: boolean
  strudelAnalyser?: AnalyserNode | null
  volume: number
  muted: boolean
  onTogglePlay: () => void
  onToggleWebcam: () => void
  onToggleMic: () => void
  onToggleSystemAudio: () => void
  onVolumeChange: (value: number) => void
  onToggleMute: () => void
  onStartRecording: () => void
  onStopRecording: () => void
  onToggleFullscreen: () => void
}

export default function ShaderControls({
  isPlaying,
  isRecording,
  isFullscreen,
  webcamEnabled,
  micEnabled,
  systemAudioEnabled,
  strudelAnalyser,
  volume,
  muted,
  onTogglePlay,
  onToggleWebcam,
  onToggleMic,
  onToggleSystemAudio,
  onVolumeChange,
  onToggleMute,
  onStartRecording,
  onStopRecording,
  onToggleFullscreen,
}: ShaderControlsProps) {
  const VolumeIcon = muted
    ? VolumeOffIcon
    : volume === 0 || volume <= 50
      ? VolumeDownIcon
      : VolumeUpIcon

  return (
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
        <IconButton onClick={onTogglePlay} size="small" sx={{ color: 'white' }}>
          {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
        </IconButton>
      </Tooltip>

      <Tooltip title={webcamEnabled ? 'Disable Webcam (iChannel0)' : 'Enable Webcam (iChannel0)'}>
        <IconButton onClick={onToggleWebcam} size="small" sx={{ color: webcamEnabled ? 'primary.main' : 'white' }}>
          {webcamEnabled ? <VideocamIcon /> : <VideocamOffIcon />}
        </IconButton>
      </Tooltip>

      <Tooltip title={micEnabled ? 'Disable Microphone (iChannel1)' : 'Enable Microphone (iChannel1)'}>
        <IconButton onClick={onToggleMic} size="small" sx={{ color: micEnabled ? 'primary.main' : 'white' }}>
          {micEnabled ? <MicIcon /> : <MicOffIcon />}
        </IconButton>
      </Tooltip>

      <Tooltip title={systemAudioEnabled ? 'Disable System Audio (iChannel1)' : 'Enable System Audio Output (iChannel1)'}>
        <IconButton onClick={onToggleSystemAudio} size="small" sx={{ color: systemAudioEnabled ? 'secondary.main' : 'white' }}>
          {systemAudioEnabled ? <VolumeUpIcon /> : <VolumeOffIcon />}
        </IconButton>
      </Tooltip>

      <ChannelStatusChips
        webcamEnabled={webcamEnabled}
        micEnabled={micEnabled}
        systemAudioEnabled={systemAudioEnabled}
        strudelAnalyser={strudelAnalyser}
      />

      <Box sx={{ flex: 1 }} />

      <Tooltip title={muted ? 'Unmute' : 'Mute'}>
        <IconButton onClick={onToggleMute} size="small" aria-label={muted ? 'Unmute' : 'Mute'} sx={{ color: 'white' }}>
          <VolumeIcon />
        </IconButton>
      </Tooltip>

      <Slider
        value={volume}
        min={0}
        max={100}
        size="small"
        aria-label="Volume"
        onChange={(_e, val) => onVolumeChange(val as number)}
        sx={{
          width: 80,
          color: 'white',
          '& .MuiSlider-thumb': { width: 12, height: 12 },
          '& .MuiSlider-rail': { opacity: 0.3 },
        }}
      />

      <Tooltip title={isRecording ? 'Stop recording' : 'Start recording'}>
        <IconButton
          onClick={isRecording ? onStopRecording : onStartRecording}
          size="small"
          aria-label={isRecording ? 'Stop recording' : 'Start recording'}
          sx={{ color: isRecording ? 'error.main' : 'white' }}
        >
          {isRecording ? <StopCircleIcon /> : <FiberManualRecordIcon />}
        </IconButton>
      </Tooltip>

      <Tooltip title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
        <IconButton onClick={onToggleFullscreen} size="small" sx={{ color: 'white' }}>
          {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
        </IconButton>
      </Tooltip>
    </Box>
  )
}
