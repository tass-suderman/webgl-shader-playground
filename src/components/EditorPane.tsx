import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Editor from '@monaco-editor/react'
import type { OnMount, BeforeMount } from '@monaco-editor/react'
import type { editor as MonacoEditorNS } from 'monaco-editor'
import { initVimMode, type VimAdapterInstance } from 'monaco-vim'
import ShaderHeader from './ShaderHeader'
import ShaderError from './editor/ShaderError'
import { GLSL_MONARCH_TOKENS, GLSL_LANGUAGE_CONFIG } from './editor/glslLanguage'
import { ensureMonacoThemes, themeNameToMonaco } from './editor/monacoThemes'

const LS_GLSL_CODE = 'shader-playground:glsl-code'
const LS_GLSL_TITLE = 'shader-playground:glsl-title'
const DEFAULT_SHADER_TITLE = 'Fragment Shader (GLSL)'

interface EditorPaneProps {
  initialCode: string
  onRun: (code: string) => void
  pendingSource: string
  onCodeChange: (code: string) => void
  shaderError: string | null
  vimMode: boolean
  themeName: string
}

export interface EditorPaneHandle {
  loadExample: (title: string, content: string) => void
}

export default forwardRef<EditorPaneHandle, EditorPaneProps>(function EditorPane(
  { initialCode, onRun, pendingSource, onCodeChange, shaderError, vimMode, themeName },
  ref,
) {
  const [shaderTitle, setShaderTitle] = useState(
    () => localStorage.getItem(LS_GLSL_TITLE) ?? DEFAULT_SHADER_TITLE,
  )
  const editorRef = useRef<MonacoEditorNS.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<Parameters<BeforeMount>[0] | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const statusBarRef = useRef<HTMLDivElement>(null)
  const vimModeInstanceRef = useRef<VimAdapterInstance | null>(null)

  // Keep a ref so Monaco keyboard shortcuts always call with latest pendingSource
  const pendingSourceRef = useRef(pendingSource)
  pendingSourceRef.current = pendingSource

  // Expose loadExample imperatively (used by App when a GLSL example is selected)
  useImperativeHandle(ref, () => ({
    loadExample(title: string, content: string) {
      editorRef.current?.setValue(content)
      onCodeChange(content)
      localStorage.setItem(LS_GLSL_CODE, content)
      setShaderTitle(title)
      localStorage.setItem(LS_GLSL_TITLE, title)
      onRun(content)
    },
  }), [onCodeChange, onRun])

  // Enable / disable vim mode whenever the prop changes or the editor mounts
  useEffect(() => {
    const editor = editorRef.current
    const statusBar = statusBarRef.current
    if (!editor || !statusBar) return

    if (vimMode) {
      if (!vimModeInstanceRef.current) {
        vimModeInstanceRef.current = initVimMode(editor, statusBar)
      }
    } else {
      if (vimModeInstanceRef.current) {
        vimModeInstanceRef.current.dispose()
        vimModeInstanceRef.current = null
        statusBar.textContent = ''
      }
    }
  }, [vimMode])

  // Forward vim status changes to the parent (used in split mode for a shared bar)
  // (Removed – vim status bar is no longer displayed)

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

  // Switch Monaco editor theme whenever the app theme changes
  useEffect(() => {
    monacoRef.current?.editor.setTheme(themeNameToMonaco(themeName))
  }, [themeName])

  const handleEditorMount = useCallback<OnMount>((editor) => {
    editorRef.current = editor
    // Initialize vim mode immediately if it is already enabled when the editor mounts
    if (vimMode && statusBarRef.current && !vimModeInstanceRef.current) {
      vimModeInstanceRef.current = initVimMode(editor, statusBarRef.current)
    }
    // Clean up vim mode when the editor is destroyed
    editor.onDidDispose(() => {
      if (vimModeInstanceRef.current) {
        vimModeInstanceRef.current.dispose()
        vimModeInstanceRef.current = null
      }
    })
  }, [vimMode])

  // Monaco's onChange fires after its built-in debounce (~300 ms), so saving
  // directly here avoids extra debounce logic while keeping localStorage current.
  const handleEditorChange = useCallback((value: string | undefined) => {
    if (value !== undefined) {
      onCodeChange(value)
      localStorage.setItem(LS_GLSL_CODE, value)
    }
  }, [onCodeChange])

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setShaderTitle(e.target.value)
    localStorage.setItem(LS_GLSL_TITLE, e.target.value)
  }, [])

  const handleExport = useCallback(() => {
    const blob = new Blob([pendingSourceRef.current], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    // Sanitize title: replace invalid filename chars, collapse repeated underscores, trim edges
    const safeName = shaderTitle
      .replace(/[^\w\s.-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^[_\s]+|[_\s]+$/g, '')
      .trim() || 'shader'
    a.download = safeName + '.glsl'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [shaderTitle])

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      const content = evt.target?.result as string
      if (content !== undefined) {
        // Update the editor display
        editorRef.current?.setValue(content)
        // Update parent state (also triggered by Monaco onChange, but set directly for safety)
        onCodeChange(content)
        localStorage.setItem(LS_GLSL_CODE, content)
        // Set title from filename, stripping the extension
        const name = file.name.replace(/\.[^.]+$/, '')
        setShaderTitle(name)
        localStorage.setItem(LS_GLSL_TITLE, name)
      }
    }
    reader.readAsText(file)
    // Reset so the same file can be re-imported
    e.target.value = ''
  }, [onCodeChange])

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: 'var(--pg-bg-panel)',
      }}
    >
      <ShaderHeader
        title={shaderTitle}
        onTitleChange={handleTitleChange}
        onImport={handleImportClick}
        onExport={handleExport}
        onRun={handleRun}
        titleAriaLabel="Shader title"
        importAriaLabel="Import shader from file"
        exportAriaLabel="Export shader to file"
        runLabel="Run Shader"
        runColor="primary"
      />

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".glsl,.frag,.vert,.fs,.vs,.txt"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <ShaderError error={shaderError} />

      {/* Monaco editor */}
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
            fontSize: 13,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            automaticLayout: true,
          }}
        />
      </Box>

      {/* Vim status bar element – kept hidden so monaco-vim has a DOM node to
          write into; the mode is not displayed to the user */}
      <Box
        ref={statusBarRef}
        component="div"
        sx={{ display: 'none' }}
      />
    </Box>
  )
})
