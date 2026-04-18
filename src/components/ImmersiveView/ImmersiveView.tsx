import { alpha, Box, createTheme, ThemeProvider } from '@mui/material'
import ShaderPane from '../ShaderPane/ShaderPane'
import ShaderControls from '../ShaderControls/ShaderControls'
import { type ShaderPaneHandle } from '../ShaderPane/ShaderPane'
import { useEffect, useMemo, useState } from 'react'
import { useAppStorage } from '../../hooks/useAppStorage'
import { useTheme } from '../../hooks/useTheme'

export interface ImmersiveViewProps {
	outerContainerRef: React.RefObject<HTMLDivElement>
	shaderRef: React.RefObject<ShaderPaneHandle>
	tabBar: React.ReactNode
	editorContent: React.ReactNode
	shaderSource: string
	setShaderError: (error: string | null) => void
	isMobile: boolean
	handleToggleImmersive: () => void
}

export const ImmersiveView = ({
	outerContainerRef,
	shaderRef,
	tabBar,
	editorContent,
	shaderSource,
	setShaderError,
	isMobile,
	handleToggleImmersive,
}: ImmersiveViewProps) => {
  const [immersiveShaderPlaying, setImmersiveShaderPlaying] = useState(true)
  const [immersiveShaderRecording, setImmersiveShaderRecording] = useState(false)
  const [immersiveShaderFullscreen, setImmersiveShaderFullscreen] = useState(false)
  const [topBarHidden, setTopBarHidden] = useState(false)

	const {
		immersiveOpacity,
	} = useAppStorage()

	const { muiTheme }  = useTheme()
  // Build a theme variant with alpha-blended backgrounds so every component
  // inside the overlay respects the immersive opacity slider automatically.
  const immersiveTheme = useMemo(() => {
    const a = immersiveOpacity / 100
    const bg = muiTheme.palette.background
    return createTheme(muiTheme, {
      palette: {
        background: {
          app:      alpha(bg.app,      a),
          panel:    alpha(bg.panel,    a),
          header:   alpha(bg.header,   a),
          button:   alpha(bg.button,   a),
          card:     alpha(bg.card,     a),
          disabled: alpha(bg.disabled, a),
          hover:    alpha(bg.hover,    a),
        },
      },
    })
  }, [muiTheme, immersiveOpacity])

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
					onShaderError={setShaderError}
					isMobile={isMobile}
					hideControls
					onPlayStateChange={setImmersiveShaderPlaying}
					onRecordingStateChange={setImmersiveShaderRecording}
					onFullscreenStateChange={setImmersiveShaderFullscreen}
				/>
			</Box>

			{/* Layer 1 – Editor overlay + controls bar stacked in one flex column */}
			<Box sx={{ position: 'absolute', inset: 0, zIndex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
				{/* Editor area – flex:1 so it fills space above the controls bar; slides up when top bar is hidden */}
				<Box
					sx={{
						flex: 1,
						minHeight: 0,
						overflow: 'hidden',
						display: 'flex',
						flexDirection: 'column',
						transform: topBarHidden ? 'translateY(-100%)' : 'translateY(0)',
						transition: 'transform 0.3s ease-in-out',
						pointerEvents: topBarHidden ? 'none' : 'auto',
						visibility: topBarHidden ? 'hidden' : 'visible',
					}}
					aria-hidden={topBarHidden}
				>
				<ThemeProvider theme={immersiveTheme}>
					{tabBar}
					{editorContent}
					</ThemeProvider>
				</Box>

				{/* Controls bar sits at the bottom and takes its natural height */}
				<ShaderControls
					isPlaying={immersiveShaderPlaying}
					isRecording={immersiveShaderRecording}
					isFullscreen={immersiveShaderFullscreen}
					onTogglePlay={() => shaderRef.current?.togglePlay()}
					onStartRecording={() => shaderRef.current?.startRecording()}
					onStopRecording={() => shaderRef.current?.stopRecording()}
					onToggleFullscreen={() => shaderRef.current?.toggleFullscreen()}
					isMobile={isMobile}
					isImmersive={true}
					onToggleImmersive={handleToggleImmersive}
					topBarHidden={topBarHidden}
					onToggleTopBar={() => setTopBarHidden(h => !h)}
				/>
			</Box>
		</Box>
	)
}
