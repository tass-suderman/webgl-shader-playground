import { Box } from '@mui/material'
import ShaderPane from '../components/shader/ShaderPane'
import ShaderControls from '../components/shader/ShaderControls'
import { type ShaderPaneHandle } from '../components/shader/ShaderPane'
import { useEffect } from 'react'

export interface ImmersiveViewProps {
	outerContainerRef: React.RefObject<HTMLDivElement>
	shaderRef: React.RefObject<ShaderPaneHandle>
	tabBar: React.ReactNode
	editorContent: React.ReactNode
	overwriteDialog: React.ReactNode
	shaderSource: string
	webcamStream: MediaStream | null
	audioStream: MediaStream | null
	webcamEnabled: boolean
	micEnabled: boolean
	handleToggleWebcam: () => void
	handleToggleMic: () => void
	handleVolumeChange: (value: number) => void
	handleToggleMute: () => void
	setShaderError: (error: string | null) => void
	isMobile: boolean
	immersiveShaderPlaying: boolean
	setImmersiveShaderPlaying: (playing: boolean) => void
	immersiveShaderRecording: boolean
	setImmersiveShaderRecording: (recording: boolean) => void
	immersiveShaderFullscreen: boolean
	setImmersiveShaderFullscreen: (fullscreen: boolean) => void
	handleToggleImmersive: () => void
	immersiveOpacity: number
	setImmersiveOpacity: (opacity: number) => void
}

export const ImmersiveView = ({
	outerContainerRef,
	shaderRef,
	tabBar,
	editorContent,
	overwriteDialog,
	shaderSource,
	webcamStream,
	audioStream,
	webcamEnabled,
	micEnabled,
	handleToggleWebcam,
	handleToggleMic,
	handleVolumeChange,
	handleToggleMute,
	setShaderError,
	isMobile,
	immersiveShaderPlaying,
	setImmersiveShaderPlaying,
	immersiveShaderRecording,
	setImmersiveShaderRecording,
	immersiveShaderFullscreen,
	setImmersiveShaderFullscreen,
	handleToggleImmersive,
	immersiveOpacity,
	setImmersiveOpacity,
}: ImmersiveViewProps) => {
  useEffect(() => {
		document.documentElement.dataset.immersive = 'true'
		document.documentElement.style.setProperty('--pg-immersive-alpha', `${immersiveOpacity}%`)
  }, [immersiveOpacity])
	return (
		<Box
			ref={outerContainerRef}
			sx={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}
		>
			{/* Layer 0 – Shader canvas, full viewport, behind everything */}
			<Box sx={{ position: 'absolute', inset: 0, zIndex: 0 }}>
				<ShaderPane
					ref={shaderRef}
					shaderSource={shaderSource}
					webcamStream={webcamStream}
					audioStream={audioStream}
					webcamEnabled={webcamEnabled}
					micEnabled={micEnabled}
					onToggleWebcam={handleToggleWebcam}
					onToggleMic={handleToggleMic}
					onVolumeChange={handleVolumeChange}
					onToggleMute={handleToggleMute}
					onShaderError={setShaderError}
					isMobile={isMobile}
					hideControls
					onPlayStateChange={setImmersiveShaderPlaying}
					onRecordingStateChange={setImmersiveShaderRecording}
					onFullscreenStateChange={setImmersiveShaderFullscreen}
				/>
			</Box>

			{/* Layer 1 – Editor overlay + controls bar stacked in one flex column */}
			<Box sx={{ position: 'absolute', inset: 0, zIndex: 1, display: 'flex', flexDirection: 'column' }}>
				{/* Editor area – flex:1 so it fills space above the controls bar */}
				<Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
					{tabBar}
					{editorContent}
				</Box>

				{/* Controls bar sits at the bottom and takes its natural height */}
				<ShaderControls
					isPlaying={immersiveShaderPlaying}
					isRecording={immersiveShaderRecording}
					isFullscreen={immersiveShaderFullscreen}
					webcamEnabled={webcamEnabled}
					micEnabled={micEnabled}
					onTogglePlay={() => shaderRef.current?.togglePlay()}
					onToggleWebcam={handleToggleWebcam}
					onToggleMic={handleToggleMic}
					onVolumeChange={handleVolumeChange}
					onToggleMute={handleToggleMute}
					onStartRecording={() => shaderRef.current?.startRecording()}
					onStopRecording={() => shaderRef.current?.stopRecording()}
					onToggleFullscreen={() => shaderRef.current?.toggleFullscreen()}
					isMobile={isMobile}
					isImmersive={true}
					onToggleImmersive={handleToggleImmersive}
					immersiveOpacity={immersiveOpacity}
					onImmersiveOpacityChange={setImmersiveOpacity}
				/>
			</Box>
			{overwriteDialog}
		</Box>
	)
}
