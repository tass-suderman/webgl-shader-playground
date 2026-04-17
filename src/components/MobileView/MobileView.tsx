import { Box, Collapse, SxProps } from "@mui/material"
import ShaderPane, { type ShaderPaneHandle } from '../ShaderPane/ShaderPane'
import { useCallback, useEffect, useState } from "react"
import { useAppStorage } from "../../hooks/useAppStorage"

interface MobileViewProps {
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

export const MobileView = ({
	outerContainerRef,
	shaderRef,
	tabBar,
	editorContent,
	shaderSource,
	handleToggleImmersive,
	editorCollapsed,
	setEditorCollapsed,
}: MobileViewProps) => {
	const [mobileShaderRatio, setMobileShaderRatio] = useState(50)
  const mobileEditorCollapseSx: SxProps = {
    flex: !editorCollapsed ? 1 : undefined,
    minHeight: 0,
    display: !editorCollapsed ? 'flex' : undefined,
    flexDirection: 'column',
		'& .MuiCollapse-wrapper, & .MuiCollapse-wrapperInner': {
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
      minHeight: 0,
    },
  }
	
	const { immersiveOpacity } = useAppStorage()

  useEffect(() => {
      delete document.documentElement.dataset.immersive
      document.documentElement.style.removeProperty('--pg-immersive-alpha')
  }, [immersiveOpacity])

  const handleMobileDividerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const container = outerContainerRef.current
    if (!container) return
    const startY = e.clientY
    const startRatio = mobileShaderRatio
    const containerH = container.getBoundingClientRect().height
    const onMove = (me: MouseEvent) => {
      const delta = me.clientY - startY
      const newRatio = Math.min(80, Math.max(20, startRatio + (delta / containerH) * 100))
      setMobileShaderRatio(newRatio)
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [mobileShaderRatio])

	return (
		<Box
			ref={outerContainerRef}
			sx={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden', bgcolor: 'background.app' }}
		>
			{/* Top: shader canvas */}
			<Box sx={{ height: editorCollapsed ? '100%' : `${mobileShaderRatio}%`, flexShrink: 0, minHeight: 0 }}>
				<ShaderPane
					ref={shaderRef}
					shaderSource={shaderSource}
					editorCollapsed={editorCollapsed}
					onToggleEditorCollapsed={() => setEditorCollapsed(!editorCollapsed)}
					isMobile={true}
					isImmersive={false}
					onToggleImmersive={handleToggleImmersive}
				/>
			</Box>

			{/* Horizontal drag divider */}
			{!editorCollapsed && (
				<Box
					onMouseDown={handleMobileDividerMouseDown}
					sx={{
						height: '4px',
						cursor: 'row-resize',
						bgcolor: 'border.faint',
						flexShrink: 0,
						'&:hover': { bgcolor: 'border.hover' },
					}}
				/>
			)}

			{/* Bottom: editor panel */}
			<Collapse in={!editorCollapsed} sx={mobileEditorCollapseSx}>
				<Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
					{tabBar}
					{editorContent}
				</Box>
			</Collapse>
		</Box>
	)
}
