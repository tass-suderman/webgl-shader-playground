import { useRef, useState } from 'react'
import {
	Box,
	IconButton,
	Popover,
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
	Preview,
} from '@mui/icons-material'
import ChannelStatusChips from '../ChannelStatusChips/ChannelStatusChips'
import { useAppStorage } from '../../hooks/useAppStorage'
import { useMediaStreams } from '../../hooks/useMediaStreams'
import { SliderControl } from '../SliderControl/SliderControl'

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

	const opacityBtnRef = useRef<HTMLButtonElement>(null)
	const [opacityPopoverOpen, setOpacityPopoverOpen] = useState(false)

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

			<SliderControl
				icon={<VolumeIcon />}
				value={volume}
				onChange={setVolume}
				label={muted ? 'Unmute' : 'Mute'}
				onIconClick={() => setMuted(!muted)}
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

			<Tooltip title="Adjust overlay opacity">
				<IconButton
					ref={opacityBtnRef}
					onClick={() => setOpacityPopoverOpen(true)}
					size="small"
					aria-label="Adjust overlay opacity"
					sx={{ color: 'white' }}
				>
					<Preview />
				</IconButton>
			</Tooltip>

			<Popover
				open={opacityPopoverOpen}
				anchorEl={opacityBtnRef.current}
				onClose={() => setOpacityPopoverOpen(false)}
				anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
				transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
				slotProps={{ paper: { sx: { bgcolor: 'rgba(0,0,0,0.85)', color: 'white', p: 2, minWidth: 200, border: '1px solid rgba(255,255,255,0.15)' } } }}
			>
				<Typography variant="caption" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
					Background opacity: {immersiveOpacity}%
				</Typography>
				<SliderControl
					icon={<Preview />}
					value={immersiveOpacity}
					onChange={setImmersiveOpacity}
					label={`Opacity: ${immersiveOpacity}%`}
				/>
			</Popover>

			<Tooltip title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
				<IconButton onClick={onToggleFullscreen} size="small" sx={{ color: 'white' }}>
					{isFullscreen ? <FullscreenExit /> : <Fullscreen />}
				</IconButton>
			</Tooltip>
		</Box>
	)
}
