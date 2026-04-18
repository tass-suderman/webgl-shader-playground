import { ImmersiveView } from '../ImmersiveView/ImmersiveView'
import { MobileView } from '../MobileView/MobileView'
import { DesktopView } from '../DesktopView/DesktopView'
import { useCallback, useRef, useState } from 'react'
import { useAppStorage, getInitialGlslCode } from '../../hooks/useAppStorage'
import { useSavedContent } from '../../hooks/useSavedContent'
import { useMediaQuery } from '@mui/material'
import { type ViewMode } from '../../constants/tabConfigs'
import { TabBar } from '../TabBar/TabBar'
import { EditorContent } from '../EditorContent/EditorContent'
import { OverwriteDialog } from '../OverwriteDialog/OverwriteDialog'
import { StrudelPaneHandle } from '../StrudelPane/StrudelPane'
import { ShaderPaneHandle } from '../ShaderPane/ShaderPane'

import { type EditorPaneHandle } from '../EditorPane/EditorPane'

type DisplayMode = 'default' | 'immersive'

interface ViewReducerProps {
	shaderRef: React.RefObject<ShaderPaneHandle>
	strudelRef: React.RefObject<StrudelPaneHandle>
	editorRef: React.RefObject<EditorPaneHandle>
}

const initialShaderCode = getInitialGlslCode()

export const ViewReducer = ({
	shaderRef,
	strudelRef,
	editorRef,
}: ViewReducerProps) => {
  const [displayMode, setDisplayMode] = useState<DisplayMode>('default')
  const [editorCollapsed, setEditorCollapsed] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('glsl')
  const [shaderSource, setShaderSource] = useState<string>(initialShaderCode)
  const [shaderError, setShaderError] = useState<string | null>(null)
  const [overwriteDialogOpen, setOverwriteDialogOpen] = useState(false)
  const [dontShowAgain, setDontShowAgain] = useState(false)
  const [overwritePending, setOverwritePending] = useState<{ title: string; content: string; type: 'shader' | 'pattern' } | null>(null)

  const outerContainerRef = useRef<HTMLDivElement>(null)

	const tabBar = (
		<TabBar viewMode={viewMode} setViewMode={setViewMode} strudelRef={strudelRef} editorRef={editorRef} />
	)

  const handleOverwriteCancel = useCallback(() => {
    setOverwriteDialogOpen(false)
    setOverwritePending(null)
  }, [])

	const {
		setWarnOnOverwrite,
	} = useAppStorage()

	const savedContent = useSavedContent()

  const commitSave = useCallback((title: string, content: string, type: 'shader' | 'pattern') => {
    if (type === 'shader') {
      savedContent.saveShader(title, content)
    } else {
      savedContent.savePattern(title, content)
    }
  }, [savedContent])

  const handleOverwriteConfirm = useCallback(() => {
    if (overwritePending) {
      if (dontShowAgain) {
        setWarnOnOverwrite(false)
      }
      commitSave(overwritePending.title, overwritePending.content, overwritePending.type)
    }
    setOverwriteDialogOpen(false)
    setOverwritePending(null)
  }, [overwritePending, dontShowAgain, setWarnOnOverwrite, commitSave])


	const editorContent = (
		<EditorContent
			viewMode={viewMode}
			initialShaderCode={initialShaderCode}
			shaderError={shaderError}
			editorRef={editorRef}
			strudelRef={strudelRef}
			setShaderSource={setShaderSource}
			setViewMode={setViewMode}
			setOverwritePending={setOverwritePending}
			setOverwriteDialogOpen={setOverwriteDialogOpen}
			setDontShowAgain={setDontShowAgain}
			commitSave={commitSave}
		/>
	)
	const overwriteDialog = (
		<OverwriteDialog
			overwriteDialogOpen={overwriteDialogOpen}
			overwritePending={overwritePending}
			dontShowAgain={dontShowAgain}
			setDontShowAgain={setDontShowAgain}
			handleOverwriteConfirm={handleOverwriteConfirm}
			handleOverwriteCancel={handleOverwriteCancel}
		/>
	)

  const handleToggleImmersive = useCallback(() => {
    setDisplayMode(m => m === 'immersive' ? 'default' : 'immersive')
  }, [])

  const isMobile = useMediaQuery('(max-width: 600px)')

	return (
		<>
			{overwriteDialog}
			{displayMode === 'immersive' ? (
				<ImmersiveView
					shaderSource={shaderSource}
					setShaderError={setShaderError}
					handleToggleImmersive={handleToggleImmersive}
					isMobile={isMobile}
					outerContainerRef={outerContainerRef}
					shaderRef={shaderRef}
					tabBar={tabBar}
					editorContent={editorContent}
				/>
			) : isMobile ? (
				<MobileView
					shaderSource={shaderSource}
					setShaderError={setShaderError}
					handleToggleImmersive={handleToggleImmersive}
					editorCollapsed={editorCollapsed}
					setEditorCollapsed={setEditorCollapsed}
					outerContainerRef={outerContainerRef}
					shaderRef={shaderRef}
					tabBar={tabBar}
					editorContent={editorContent}
				/>
			) : (
				<DesktopView
					shaderSource={shaderSource}
					setShaderError={setShaderError}
					handleToggleImmersive={handleToggleImmersive}
					editorCollapsed={editorCollapsed}
					setEditorCollapsed={setEditorCollapsed}
					outerContainerRef={outerContainerRef}
					shaderRef={shaderRef}
					tabBar={tabBar}
					editorContent={editorContent}
				/>
			)}
		</>
	)
}
