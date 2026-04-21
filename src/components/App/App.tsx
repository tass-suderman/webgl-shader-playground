import { useEffect, useRef } from 'react'
import { GlobalStyles, ThemeProvider } from '@mui/material'
import { type ShaderPaneHandle } from '../ShaderPane/ShaderPane'
import { type StrudelPaneHandle } from '../StrudelPane/StrudelPane'
import { type EditorPaneHandle } from '../EditorPane/EditorPane'
import { useTheme } from '../../hooks/useTheme'
import { useViewState } from '../../hooks/useViewState'
import { ImmersiveView } from '../ImmersiveView/ImmersiveView'
import { TabBar } from '../TabBar/TabBar'
import { EditorContent } from '../EditorContent/EditorContent'
import { OverwriteDialog } from '../OverwriteDialog/OverwriteDialog'

export default function App() {
  const strudelRef = useRef<StrudelPaneHandle>(null)
  const shaderRef = useRef<ShaderPaneHandle>(null)
  const editorRef = useRef<EditorPaneHandle>(null)
	const { muiTheme } = useTheme()

	const {
		viewMode, setViewMode,
		shaderSource,
		setShaderSource,
		shaderError, setShaderError,
		overwriteDialogOpen,
		dontShowAgain, setDontShowAgain,
		overwritePending, setOverwritePending,
		setOverwriteDialogOpen,
		outerContainerRef,
		commitSave,
		handleOverwriteCancel,
		handleOverwriteConfirm,
	} = useViewState()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
			const handleKeyboardEvent = (e: KeyboardEvent, keyboardAction: () => void) => {
				e.preventDefault()
				e.stopPropagation()
				keyboardAction()
			}

      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
				handleKeyboardEvent(e, () => {
					editorRef.current?.run()
					shaderRef.current?.unpause()
				})
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '.') {
				handleKeyboardEvent(e, () => shaderRef.current?.togglePlay())
        return
      }
      if (e.altKey && e.key === 'Enter') {
				handleKeyboardEvent(e, () => strudelRef.current?.play())
        return
      }
      if (e.altKey && e.key === '.') {
				handleKeyboardEvent(e, () => strudelRef.current?.pause())
      }
    }
    window.addEventListener('keydown', handler, { capture: true })
    return () => window.removeEventListener('keydown', handler, { capture: true })
  }, [])

  return (
		<ThemeProvider theme={muiTheme}>
			<GlobalStyles styles={{
				'.MuiTypography-root': {
					color: 'textColor.primary',
				},
			}} />
			<OverwriteDialog
				overwriteDialogOpen={overwriteDialogOpen}
				overwritePending={overwritePending}
				dontShowAgain={dontShowAgain}
				setDontShowAgain={setDontShowAgain}
				handleOverwriteConfirm={handleOverwriteConfirm}
				handleOverwriteCancel={handleOverwriteCancel}
			/>
			<ImmersiveView
				shaderSource={shaderSource}
				setShaderError={setShaderError}
				outerContainerRef={outerContainerRef}
				shaderRef={shaderRef}
				tabBar={
					<TabBar viewMode={viewMode} setViewMode={setViewMode} strudelRef={strudelRef} editorRef={editorRef} />
				}
				editorContent={
					<EditorContent
						viewMode={viewMode}
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
				}
			/>
		</ThemeProvider>
  )
}
