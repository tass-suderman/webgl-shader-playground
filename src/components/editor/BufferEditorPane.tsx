import { useCallback, useEffect, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Editor from '@monaco-editor/react'
import type { OnMount, BeforeMount } from '@monaco-editor/react'
import { initVimMode, type VimAdapterInstance } from 'monaco-vim'
import ShaderError from '../shader/ShaderError'
import { GLSL_MONARCH_TOKENS, GLSL_LANGUAGE_CONFIG } from './glslLanguage'
import { ensureMonacoThemes, themeNameToMonaco } from './monacoThemes'

interface BufferEditorPaneProps {
  /** Human-readable label, e.g. "Buffer A" */
  label: string
  /** GLSL channel name shown in the header, e.g. "iChannel3" */
  channelName: string
  initialCode: string
  onRun: (code: string) => void
  pendingSource: string
  onCodeChange: (code: string) => void
  onSave?: (code: string) => void
  shaderError: string | null
  vimMode: boolean
  themeName: string
  fontSize?: number
}

export default function BufferEditorPane({
  label,
  channelName,
  initialCode,
  onRun,
  pendingSource,
  onCodeChange,
  onSave,
  shaderError,
  vimMode,
  themeName,
  fontSize = 13,
}: BufferEditorPaneProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<any>(null)
  const monacoRef = useRef<Parameters<BeforeMount>[0] | null>(null)
  const vimModeInstanceRef = useRef<VimAdapterInstance | null>(null)
  const statusBarRef = useRef(document.createElement('div'))
  const pendingSourceRef = useRef(pendingSource)
  pendingSourceRef.current = pendingSource

  // Buffer-specific error: only show errors whose prefix matches this channel
  const [localError, setLocalError] = useState<string | null>(null)
  useEffect(() => {
    if (!shaderError) {
      setLocalError(null)
    } else if (shaderError.startsWith(`${channelName}:`)) {
      setLocalError(shaderError.slice(channelName.length + 1).trim())
    } else {
      // Error belongs to a different pass – don't show it here
      setLocalError(null)
    }
  }, [shaderError, channelName])

  const handleRun = useCallback(() => {
    onRun(pendingSourceRef.current)
  }, [onRun])

  const handleBeforeMount = useCallback<BeforeMount>((monaco) => {
    monacoRef.current = monaco
    monaco.languages.register({ id: 'glsl' })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    monaco.languages.setMonarchTokensProvider('glsl', GLSL_MONARCH_TOKENS as any)
    monaco.languages.setLanguageConfiguration('glsl', GLSL_LANGUAGE_CONFIG)
    ensureMonacoThemes(monaco)
  }, [])

  useEffect(() => {
    monacoRef.current?.editor.setTheme(themeNameToMonaco(themeName))
  }, [themeName])

  const handleEditorMount = useCallback<OnMount>((editor) => {
    editorRef.current = editor
    if (vimMode && !vimModeInstanceRef.current) {
      vimModeInstanceRef.current = initVimMode(editor, statusBarRef.current)
    }
    editor.onDidDispose(() => {
      if (vimModeInstanceRef.current) {
        vimModeInstanceRef.current.dispose()
        vimModeInstanceRef.current = null
      }
    })
  }, [vimMode])

  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return
    if (vimMode) {
      if (!vimModeInstanceRef.current) {
        vimModeInstanceRef.current = initVimMode(editor, statusBarRef.current)
      }
    } else {
      if (vimModeInstanceRef.current) {
        vimModeInstanceRef.current.dispose()
        vimModeInstanceRef.current = null
      }
    }
  }, [vimMode])

  useEffect(() => {
    editorRef.current?.updateOptions({ fontSize })
  }, [fontSize])

  const handleEditorChange = useCallback((value: string | undefined) => {
    if (value !== undefined) {
      onCodeChange(value)
      onSave?.(value)
    }
  }, [onCodeChange, onSave])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'var(--pg-bg-panel)' }}>
      {/* Header */}
      <Box sx={{
        px: 1.5,
        py: 0.5,
        bgcolor: 'var(--pg-bg-header)',
        borderBottom: '1px solid var(--pg-border-subtle)',
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        flexShrink: 0,
      }}>
        <Typography
          variant="body2"
          sx={{ fontFamily: 'monospace', color: 'var(--pg-text-primary)', flex: 1, fontSize: '0.85rem' }}
        >
          {label}&nbsp;
          <span style={{ color: 'var(--pg-accent)', fontSize: '0.8rem' }}>({channelName})</span>
        </Typography>
        <Button
          size="small"
          variant="contained"
          color="primary"
          onClick={handleRun}
          sx={{ textTransform: 'none', fontSize: '0.75rem', py: 0.25, px: 1 }}
        >
          Run
        </Button>
      </Box>

      <ShaderError error={localError} />

      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <Editor
          height="100%"
          defaultLanguage="glsl"
          defaultValue={initialCode}
          onChange={handleEditorChange}
          beforeMount={handleBeforeMount}
          onMount={handleEditorMount}
          theme={themeNameToMonaco(themeName)}
          options={{
            minimap: { enabled: false },
            fontSize: fontSize,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            automaticLayout: true,
          }}
        />
      </Box>
    </Box>
  )
}
