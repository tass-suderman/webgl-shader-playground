import { useRef, useState } from 'react'
import {
	Box,
  IconButton,
  Popover,
  Slider,
  Tooltip,
  Typography,
} from '@mui/material'
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
	ChevronLeft,
	ChevronRight,
	ExpandMore,
	ExpandLess,
	Preview,
} from '@mui/icons-material'
import ChannelStatusChips from '../ChannelStatusChips/ChannelStatusChips'
import { useAppStorage } from '../../hooks/useAppStorage'
import { useMediaStreams } from '../../hooks/useMediaStreams'

interface ShaderControlsProps {
  isPlaying: boolean
  isRecording: boolean
  isFullscreen: boolean
  onTogglePlay: () => void
  onStartRecording: () => void
  onStopRecording: () => void
  onToggleFullscreen: () => void
  editorCollapsed?: boolean
  onToggleEditorCollapsed?: () => void
  isMobile?: boolean
  isImmersive?: boolean
  onToggleImmersive?: () => void
}

export default function ShaderControls({
  isPlaying,
  isRecording,
  isFullscreen,
  onTogglePlay,
  onStartRecording,
  onStopRecording,
  onToggleFullscreen,
  editorCollapsed,
  onToggleEditorCollapsed,
  isMobile = false,
  isImmersive = false,
  onToggleImmersive,
}: ShaderControlsProps) {
	const { 
		muted, setMuted,
		volume, setVolume,
		immersiveOpacity, setImmersiveOpacity,
	} = useAppStorage()

  const {
    webcamEnabled,
    micEnabled,
		handleToggleWebcam,
		handleToggleMic,
  } = useMediaStreams()

  const Volume = (muted || volume === 0)
    ? VolumeOff
    : volume <= 50
      ? VolumeDown
      : VolumeUp

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
          {isPlaying ? <Pause /> : <PlayArrow />}
        </IconButton>
      </Tooltip>

      <Tooltip title={webcamEnabled ? 'Disable Webcam (iChannel0)' : 'Enable Webcam (iChannel0)'}>
        <IconButton onClick={handleToggleWebcam} size="small" sx={{ color: webcamEnabled ? 'background.hover' : 'white' }}>
          {webcamEnabled ? <Videocam /> : <VideocamOff />}
        </IconButton>
      </Tooltip>

      <Tooltip title={micEnabled ? 'Disable Microphone (iChannel1)' : 'Enable Microphone (iChannel1)'}>
        <IconButton onClick={handleToggleMic} size="small" sx={{ color: micEnabled ? 'background.hover' : 'white' }}>
          {micEnabled ? <Mic /> : <MicOff />}
        </IconButton>
      </Tooltip>

      <ChannelStatusChips />

      <Box sx={{ flex: 1 }} />

      <Tooltip title={muted ? 'Unmute' : 'Mute'}>
        <IconButton onClick={() => setMuted(!muted)} size="small" aria-label={muted ? 'Unmute' : 'Mute'} sx={{ color: 'white' }}>
          <Volume />
        </IconButton>
      </Tooltip>

      <Slider
        value={volume}
        min={0}
        max={100}
        size="small"
        aria-label="Volume"
        onChange={(_e, val) => setVolume(val as number)}
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
          {isRecording ? <StopCircle /> : <FiberManualRecord />}
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
              sx={{ color: isImmersive ? 'background.hover' : 'white' }}
            >
              <Preview />
            </IconButton>
          </Tooltip>

          {isImmersive && (
            <Tooltip title={`Opacity: ${immersiveOpacity}%`}>
              <Slider
                value={immersiveOpacity}
                onChange={(_e, val) => setImmersiveOpacity?.(val as number)}
                min={0}
                max={100}
                step={1}
                size="small"
                aria-label="Background opacity"
                sx={{
                  width: 80,
                  color: 'white',
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
              onChange={(_e, val) => setImmersiveOpacity?.(val as number)}
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
          {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
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
              ? (editorCollapsed ? <ExpandLess /> : <ExpandMore />)
              : (editorCollapsed ? <ChevronLeft /> : <ChevronRight />)
            }
          </IconButton>
        </Tooltip>
      )}
    </Box>
  )
}
