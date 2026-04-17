import { Box, Collapse, SxProps, Theme } from '@mui/material';
import ShaderPane, { type ShaderPaneHandle } from '../ShaderPane/ShaderPane';
import { useCallback, useEffect, useState } from 'react';
import { useAppStorage } from '../../hooks/useAppStorage';

interface DesktopViewProps {
	outerContainerRef: React.RefObject<HTMLDivElement>
	shaderRef: React.RefObject<ShaderPaneHandle>
	tabBar: React.ReactNode
	editorContent: React.ReactNode
	shaderSource: string
	setShaderError: (error: string | null) => void
	handleToggleImmersive: () => void
	editorCollapsed: boolean
	setEditorCollapsed: (collapsed: boolean) => void
}

export const DesktopView = ({
	outerContainerRef,
	shaderRef,
	tabBar,
	editorContent,
	shaderSource,
	setShaderError,
	handleToggleImmersive,
	editorCollapsed,
	setEditorCollapsed,
}: DesktopViewProps) => {

	const {
		immersiveOpacity,
	} = useAppStorage()

  const [leftRatio, setLeftRatio] = useState(50)

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

  const collapseSx = {
    flex: !editorCollapsed ? 1 : undefined,
    minWidth: 0,
    display: !editorCollapsed ? 'flex' : undefined,
    flexDirection: 'column',
    '& .MuiCollapse-wrapper, & .MuiCollapse-wrapperInner': {
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
    },
  } as SxProps<Theme>


  useEffect(() => {
      delete document.documentElement.dataset.immersive
      document.documentElement.style.removeProperty('--pg-immersive-alpha')
  }, [immersiveOpacity])

	return (
		<Box ref={outerContainerRef} sx={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', bgcolor: 'background.app' }}>
			<Box sx={{ width: editorCollapsed ? '100%' : `${leftRatio}%`, minWidth: 0, flexShrink: 0 }}>
				<ShaderPane
					ref={shaderRef}
					shaderSource={shaderSource}
					onShaderError={setShaderError}
					editorCollapsed={editorCollapsed}
					onToggleEditorCollapsed={() => setEditorCollapsed(!editorCollapsed)}
					isMobile={false}
					isImmersive={false}
					onToggleImmersive={handleToggleImmersive}
				/>
			</Box>

			{!editorCollapsed && (
				<Box
					onMouseDown={handleHorizontalDividerMouseDown}
					sx={{
						width: '3px',
						cursor: 'col-resize',
						bgcolor: 'border.subtle',
						flexShrink: 0,
						'&:hover': { bgcolor: 'border.hover'},
					}}
				/>
			)}

			<Collapse orientation="horizontal" in={!editorCollapsed} sx={collapseSx}>
				<Box sx={{ flex: 1, height: '100%', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
					{tabBar}
					{editorContent}
				</Box>
			</Collapse>
		</Box>
	)
}
