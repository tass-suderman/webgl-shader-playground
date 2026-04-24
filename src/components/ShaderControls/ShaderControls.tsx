import { Box, Tooltip, IconButton } from '@mui/material'
import {
  PlayArrow,
  Pause,
  Fullscreen,
  FullscreenExit,
  Videocam,
  VideocamOff,
  Mic,
  MicOff,
  VolumeUp,
  VolumeDown,
  VolumeOff,
  FiberManualRecord,
  StopCircle,
  Preview,
} from '@mui/icons-material'
import { useAppStorage } from '../../hooks/useAppStorage'
import { useMediaStreams } from '../../hooks/useMediaStreams'
import { SliderControl } from '../SliderControl/SliderControl'
import { ToggleIconButton } from '../ToggleIconButton/ToggleIconButton'

interface ShaderControlsProps {
	isPlaying: boolean
	isRecording: boolean
	isFullscreen: boolean
	onTogglePlay: () => void
	onStartRecording: () => void
	onStopRecording: () => void
	onToggleFullscreen: () => void
}

export default function ShaderControls({
  isPlaying,
  isRecording,
  isFullscreen,
  onTogglePlay,
  onStartRecording,
  onStopRecording,
  onToggleFullscreen,
}: ShaderControlsProps) {
  const {
    muted, setMuted,
    volume, setVolume,
    immersiveOpacity, setImmersiveOpacity,
    immersiveToggle, setImmersiveToggle
  } = useAppStorage()

  const {
    webcamEnabled,
    micEnabled,
    handleToggleWebcam,
    handleToggleMic,
  } = useMediaStreams()

  const VolumeIcon = (muted || volume === 0)
    ? VolumeOff
    : volume <= 50
      ? VolumeDown
      : VolumeUp

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
      {/* Left side: Play/Pause, Webcam, Microphone, Recording */}
      <ToggleIconButton
        onClick={onTogglePlay}
        checked={isPlaying}
        inactiveProps={{ icon: <PlayArrow />, label: 'Play', color: 'white' }}
        activeProps={{ icon: <Pause />, label: 'Pause', color: 'white' }}
      />

      <ToggleIconButton
        onClick={handleToggleWebcam}
        checked={webcamEnabled}
        inactiveProps={{ icon: <VideocamOff />, label: 'Enable Webcam (iChannel0)', color: 'white' }}
        activeProps={{ icon: <Videocam />, label: 'Disable Webcam (iChannel0)', color: 'background.hover' }}
      />

      <ToggleIconButton
        onClick={handleToggleMic}
        checked={micEnabled}
        inactiveProps={{ icon: <MicOff />, label: 'Enable Microphone (iChannel1)', color: 'white' }}
        activeProps={{ icon: <Mic />, label: 'Disable Microphone (iChannel1)', color: 'background.hover' }}
      />

      <ToggleIconButton
        onClick={isRecording ? onStopRecording : onStartRecording}
        checked={isRecording}
        inactiveProps={{ icon: <FiberManualRecord />, label: 'Start recording', color: 'white' }}
        activeProps={{ icon: <StopCircle />, label: 'Stop recording', color: 'error.main' }}
      />

      <Box sx={{ flex: 1 }} />

      {/* Right side: Volume, Opacity, Fullscreen */}
      <SliderControl
        icon={<VolumeIcon />}
        value={volume}
        onChange={setVolume}
        label={muted ? 'Unmute' : 'Mute'}
        iconColor={muted ? 'error.main' : 'white'}
        disabled={muted}
        onIconClick={() => setMuted(!muted)}
      />

      <SliderControl
        icon={<Preview />}
        value={immersiveOpacity}
        onChange={setImmersiveOpacity}
        label={`Overlay opacity: ${immersiveOpacity}%`}
        iconColor={immersiveToggle ? 'error.main' : 'white'}
        onIconClick={() => {
          if(!immersiveToggle && isPlaying) {
            onTogglePlay()
          }
          setImmersiveToggle(!immersiveToggle)
        }}
        disabled={immersiveToggle}
      />

      <Tooltip title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
        <IconButton onClick={onToggleFullscreen} size="small" sx={{ color: 'white' }}>
          {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
        </IconButton>
      </Tooltip>
    </Box>
  )
}

