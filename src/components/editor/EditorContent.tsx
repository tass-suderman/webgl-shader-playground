import {Box} from '@mui/material'
import { useCallback, useMemo, useRef, useState } from 'react'
import EditorPane, { type EditorPaneHandle } from './EditorPane'
import StrudelPane, { type StrudelPaneHandle } from '../strudel/StrudelPane'
import SettingsPane from '../settings/SettingsPane'
import SavedPane from './SavedPane'
import AboutPane from '../about/AboutPane'
import { useTheme } from '../../hooks/useTheme'
import { ViewMode } from '../../constants/tabConfigs'
import { useSavedContent } from '../../hooks/useSavedContent'
import { useStrudelAnalyzer } from '../../hooks/useStrudelAnalyzer'
import { useStrudelAudioStream } from '../../hooks/useStrudelAudioStream'

export interface EditorContentProps {
	viewMode: ViewMode
	vimMode: boolean
	fontSize: number
	warnOnOverwrite: boolean
	initialShaderCode: string
	shaderError: string | null
	strudelRef: React.RefObject<StrudelPaneHandle>
	setFontSize: (size: number) => void
	setWarnOnOverwrite: (warn: boolean) => void
	setShaderSource: (source: string) => void
	setOverwritePending: (pending: { title: string, content: string, type: 'shader' | 'pattern' } | null) => void
	setDontShowAgain: (dontShow: boolean) => void
	setOverwriteDialogOpen: (open: boolean) => void
	setViewMode: (mode: ViewMode) => void
	handleVimModeChange: (enabled: boolean) => void
	handleThemeChange: (themeName: string) => void
	commitSave: (title: string, content: string, type: 'shader' | 'pattern') => void
}

export const EditorContent = ({
	viewMode,
	vimMode,
	fontSize,
	warnOnOverwrite,
	initialShaderCode,
	shaderError,
	strudelRef,
	handleVimModeChange,
	handleThemeChange,
	setFontSize,
	setWarnOnOverwrite,
	setShaderSource,
	setViewMode,
	setOverwritePending,
  setOverwriteDialogOpen,
	setDontShowAgain,
	commitSave,
}: EditorContentProps) => {
  const [pendingSource, setPendingSource] = useState<string>(initialShaderCode)

  const savedContent = useSavedContent()
	const { currentTheme } = useTheme()

  const showGlsl = useMemo(() => viewMode === 'glsl', [viewMode])
  const showStrudel = useMemo(() => viewMode === 'strudel', [viewMode])
	//
  const pendingSourceRef = useRef(pendingSource)
  pendingSourceRef.current = pendingSource

  const handleRun = useCallback((code: string) => {
    setShaderSource(code)
  }, [])

	const { setAnalyzer } = useStrudelAnalyzer();
	const { setStrudelAudioStream } = useStrudelAudioStream()

  const editorRef = useRef<EditorPaneHandle>(null)

  const handleLoadGlslExample = useCallback((title: string, content: string) => {
    editorRef.current?.loadExample(title, content)
    setViewMode('glsl')
  }, [])

  const handleLoadStrudelExample = useCallback((title: string, content: string) => {
    strudelRef.current?.loadExample(title, content)
    setViewMode('strudel')
  }, [])

  const handleLoadSavedShader = useCallback((title: string, content: string) => {
    editorRef.current?.loadExample(title, content)
    setViewMode('glsl')
  }, [])

  const handleLoadSavedPattern = useCallback((title: string, content: string) => {
    strudelRef.current?.loadExample(title, content)
    setViewMode('strudel')
  }, [])


  const handleSaveShader = useCallback((title: string, content: string) => {
    if (warnOnOverwrite && savedContent.hasExistingShader(title)) {
      setOverwritePending({ title, content, type: 'shader' })
      setDontShowAgain(false)
      setOverwriteDialogOpen(true)
    } else {
      commitSave(title, content, 'shader')
    }
  }, [warnOnOverwrite, savedContent, commitSave])

  const handleSavePattern = useCallback((title: string, content: string) => {
    if (warnOnOverwrite && savedContent.hasExistingPattern(title)) {
      setOverwritePending({ title, content, type: 'pattern' })
      setDontShowAgain(false)
      setOverwriteDialogOpen(true)
    } else {
      commitSave(title, content, 'pattern')
    }
  }, [warnOnOverwrite, savedContent, commitSave])

	return (
		<>
			<Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
				{/* About panel */}
				{viewMode === 'about' && <AboutPane />}

				{/* Settings panel */}
				{viewMode === 'settings' && (
					<SettingsPane
						vimMode={vimMode}
						onVimModeChange={handleVimModeChange}
						themeName={currentTheme.name}
						onThemeChange={handleThemeChange}
						fontSize={fontSize}
						onFontSizeChange={setFontSize}
						warnOnOverwrite={warnOnOverwrite}
						onWarnOnOverwriteChange={setWarnOnOverwrite}
					/>
				)}

				{/* Saved panel (Saved Content + Examples) */}
				{viewMode === 'saved' && (
					<Box sx={{ flex: 1, overflow: 'hidden' }}>
						<SavedPane
							savedShaders={savedContent.savedShaders}
							savedPatterns={savedContent.savedPatterns}
							onDeleteShader={savedContent.deleteShader}
							onDeletePattern={savedContent.deletePattern}
							onLoadShader={handleLoadSavedShader}
							onLoadPattern={handleLoadSavedPattern}
							onLoadGlslExample={handleLoadGlslExample}
							onLoadStrudelExample={handleLoadStrudelExample}
						/>
					</Box>
				)}

				{/* GLSL editor – hidden but mounted when not visible to preserve state */}
				<Box sx={{
					display: showGlsl ? 'flex' : 'none',
					flexDirection: 'column',
					height: '100%',
					minHeight: 0,
				}}>
					<EditorPane
						ref={editorRef}
						initialCode={initialShaderCode}
						onRun={handleRun}
						pendingSource={pendingSource}
						onCodeChange={setPendingSource}
						shaderError={shaderError}
						vimMode={vimMode}
						themeName={currentTheme.name}
						fontSize={fontSize}
						onSave={handleSaveShader}
					/>
				</Box>

				{/* Strudel pane – hidden but mounted when not visible to preserve state */}
				<Box sx={{
					display: showStrudel ? 'flex' : 'none',
					flexDirection: 'column',
					height: '100%',
					minHeight: 0,
				}}>
					<StrudelPane
						ref={strudelRef}
						onAnalyserReady={setAnalyzer}
						onAudioStreamReady={setStrudelAudioStream}
						vimMode={vimMode}
						themeName={currentTheme.name}
						fontSize={fontSize}
						onSave={handleSavePattern}
					/>
				</Box>
			</Box>
		</>
	)
}
