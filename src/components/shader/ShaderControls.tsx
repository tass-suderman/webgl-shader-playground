import { useRef, useState } from 'react'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Popover from '@mui/material/Popover'
import Slider from '@mui/material/Slider'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
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
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import PreviewIcon from '@mui/icons-material/Preview'
import ChannelStatusChips from './ChannelStatusChips'

interface ShaderControlsProps {
  isPlaying: boolean
  isRecording: boolean
  isFullscreen: boolean
  webcamEnabled: boolean
  micEnabled: boolean
  strudelAnalyser?: AnalyserNode | null
  volume: number
  muted: boolean
  onTogglePlay: () => void
  onToggleWebcam: () => void
  onToggleMic: () => void
  onVolumeChange: (value: number) => void
  onToggleMute: () => void
  onStartRecording: () => void
  onStopRecording: () => void
  onToggleFullscreen: () => void
  /** Whether the editor panel is currently collapsed */
  editorCollapsed?: boolean
  /** Callback to toggle editor collapse/expand */
  onToggleEditorCollapsed?: () => void
  /** True when on a narrow/mobile viewport (affects icon direction) */
  isMobile?: boolean
  /** Whether immersive mode is currently active */
  isImmersive?: boolean
  /** Callback to toggle immersive mode */
  onToggleImmersive?: () => void
  /** Background opacity (0–100) used in immersive mode */
  immersiveOpacity?: number
  /** Callback when the immersive opacity slider changes */
  onImmersiveOpacityChange?: (opacity: number) => void
}

export default function ShaderControls({
  isPlaying,
  isRecording,
  isFullscreen,
  webcamEnabled,
  micEnabled,
  strudelAnalyser,
  volume,
  muted,
  onTogglePlay,
  onToggleWebcam,
  onToggleMic,
  onVolumeChange,
  onToggleMute,
  onStartRecording,
  onStopRecording,
  onToggleFullscreen,
  editorCollapsed,
  onToggleEditorCollapsed,
  isMobile = false,
  isImmersive = false,
  onToggleImmersive,
  immersiveOpacity = 50,
  onImmersiveOpacityChange,
}: ShaderControlsProps) {
  const VolumeIcon = muted
    ? VolumeOffIcon
    : volume === 0 || volume <= 50
      ? VolumeDownIcon
      : VolumeUpIcon

  const previewBtnRef = useRef<HTMLButtonElement>(null)
  const [opacityPopoverOpen, setOpacityPopoverOpen] = useState(false)

  const handlePreviewClick = () => {
    onToggleImmersive?.()
    setOpacityPopoverOpen(true)
  }

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

      <ChannelStatusChips
        webcamEnabled={webcamEnabled}
        micEnabled={micEnabled}
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

      {onToggleImmersive !== undefined && (
        <>
          <Tooltip title={isImmersive ? 'Exit immersive mode' : 'Immersive mode'}>
            <IconButton
              ref={previewBtnRef}
              onClick={handlePreviewClick}
              size="small"
              aria-label={isImmersive ? 'Exit immersive mode' : 'Immersive mode'}
              sx={{ color: isImmersive ? 'primary.light' : 'white' }}
            >
              <PreviewIcon />
            </IconButton>
          </Tooltip>

          {isImmersive && (
            <Tooltip title={`Opacity: ${immersiveOpacity}%`}>
              <Slider
                value={immersiveOpacity}
                onChange={(_e, val) => onImmersiveOpacityChange?.(val as number)}
                min={0}
                max={100}
                step={1}
                size="small"
                aria-label="Background opacity"
                sx={{
                  width: 80,
                  color: 'primary.light',
                  '& .MuiSlider-thumb': { width: 12, height: 12 },
                  '& .MuiSlider-rail': { opacity: 0.3 },
                }}
              />
            </Tooltip>
          )}

          <Popover
            open={opacityPopoverOpen}
            anchorEl={previewBtnRef.current}
            onClose={() => setOpacityPopoverOpen(false)}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            slotProps={{ paper: { sx: { bgcolor: 'rgba(0,0,0,0.85)', color: 'white', p: 2, minWidth: 200, border: '1px solid rgba(255,255,255,0.15)' } } }}
          >
            <Typography variant="caption" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
              Background opacity: {immersiveOpacity}%
            </Typography>
            <Slider
              value={immersiveOpacity}
              onChange={(_e, val) => onImmersiveOpacityChange?.(val as number)}
              min={0}
              max={100}
              step={1}
              size="small"
              disabled={!isImmersive}
              sx={{
                color: 'white',
                '& .MuiSlider-thumb': { width: 12, height: 12 },
                '& .MuiSlider-rail': { opacity: 0.3 },
              }}
            />
            {!isImmersive && (
              <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'rgba(255,255,255,0.5)' }}>
                Enable immersive mode to adjust
              </Typography>
            )}
          </Popover>
        </>
      )}

      <Tooltip title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
        <IconButton onClick={onToggleFullscreen} size="small" sx={{ color: 'white' }}>
          {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
        </IconButton>
      </Tooltip>

      {onToggleEditorCollapsed !== undefined && (
        <Tooltip title={editorCollapsed ? 'Expand Editor' : 'Collapse Editor'}>
          <IconButton
            onClick={onToggleEditorCollapsed}
            size="small"
            aria-label={editorCollapsed ? 'Expand Editor' : 'Collapse Editor'}
            sx={{ color: 'white' }}
          >
            {isMobile
              ? (editorCollapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />)
              : (editorCollapsed ? <ChevronLeftIcon /> : <ChevronRightIcon />)
            }
          </IconButton>
        </Tooltip>
      )}
    </Box>
  )
}
