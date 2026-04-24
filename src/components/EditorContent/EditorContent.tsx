import {Box} from '@mui/material'
import { useCallback, useMemo } from 'react'
import EditorPane, { type EditorPaneHandle } from '../EditorPane/EditorPane'
import StrudelPane, { type StrudelPaneHandle } from '../StrudelPane/StrudelPane'
import SettingsPane from '../SettingsPane/SettingsPane'
import SavedPane from '../SavedPane/SavedPane'
import AboutPane from '../AboutPane/AboutPane'
import { ViewMode } from '../../utility/tabConfigs'
import { useSavedContent } from '../../hooks/useSavedContent'
import { useStrudelAnalyzer } from '../../hooks/useStrudelAnalyzer'
import { useStrudelAudioStream } from '../../hooks/useStrudelAudioStream'
import { useAppStorage } from '../../hooks/useAppStorage'

export interface EditorContentProps {
	viewMode: ViewMode
	shaderError: string | null
	editorRef: React.RefObject<EditorPaneHandle>
	strudelRef: React.RefObject<StrudelPaneHandle>
	setShaderSource: (source: string) => void
	setOverwritePending: (pending: { title: string, content: string, type: 'shader' | 'pattern' } | null) => void
	setDontShowAgain: (dontShow: boolean) => void
	setOverwriteDialogOpen: (open: boolean) => void
	setViewMode: (mode: ViewMode) => void
	commitSave: (title: string, content: string, type: 'shader' | 'pattern') => void
}

export const EditorContent = ({
  viewMode,
  shaderError,
  editorRef,
  strudelRef,
  setShaderSource,
  setOverwritePending,
  setDontShowAgain,
  setOverwriteDialogOpen,
  setViewMode,
  commitSave,
}: EditorContentProps) => {

  const savedContent = useSavedContent()

  const showGlsl = useMemo(() => viewMode === 'glsl', [viewMode])
  const showStrudel = useMemo(() => viewMode === 'strudel', [viewMode])

  const handleRun = useCallback((code: string) => {
    setShaderSource(code)
  }, [])

  const { 
    warnOnOverwrite,
  } = useAppStorage()

  const { setAnalyzer } = useStrudelAnalyzer();
  const { setStrudelAudioStream } = useStrudelAudioStream()

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
          <SettingsPane />
        )}

        {/* Saved panel (Saved Content + Examples) */}
        {viewMode === 'saved' && (
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            <SavedPane
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
            onRun={handleRun}
            shaderError={shaderError}
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
            onSave={handleSavePattern}
          />
        </Box>
      </Box>
    </>
  )
}
