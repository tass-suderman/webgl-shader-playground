import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Editor from '@monaco-editor/react'
import type { OnMount, BeforeMount } from '@monaco-editor/react'
// import type { editor as MonacoEditorNS } from 'monaco-editor'
import { initVimMode, type VimAdapterInstance } from 'monaco-vim'
import ShaderHeader from '../EditorHeader/EditorHeader'
import ShaderError from '../ShaderError/ShaderError'
import UniformsPanel from '../UniformsPanel/UniformsPanel'
import { GLSL_MONARCH_TOKENS, GLSL_LANGUAGE_CONFIG } from '../../utility/shader/glslLanguage'
import { ensureMonacoThemes, themeNameToMonaco } from '../../utility/shader/monacoThemes'
import { saveGlslCode, saveGlslTitle, getInitialGlslCode, getInitialGlslTitle, useAppStorage } from '../../hooks/useAppStorage'
import { useTheme } from '../../hooks/useTheme'

const DEFAULT_SHADER_TITLE = 'Fragment Shader (GLSL)'

interface EditorPaneProps {
  onRun: (code: string) => void
  shaderError: string | null
  onSave: (title: string, content: string) => void
  hideHeader?: boolean
}

export interface EditorPaneHandle {
  loadExample: (title: string, content: string) => void
  run: () => void
  getTitle: () => string
  setTitle: (title: string) => void
  save: () => void
  triggerImport: () => void
  triggerExport: () => void
  toggleUniforms: () => void
  closeUniforms: () => void
}

export default forwardRef<EditorPaneHandle, EditorPaneProps>(function EditorPane(
  { onRun, shaderError, onSave, hideHeader = false },
  ref,
) {
  const [pendingSource, setPendingSource] = useState<string>(() => getInitialGlslCode())
  const [shaderTitle, setShaderTitle] = useState(
    () => getInitialGlslTitle(DEFAULT_SHADER_TITLE),
  )
  const [uniformsOpen, setUniformsOpen] = useState(false)
  const [uniformsSplitRatio, setUniformsSplitRatio] = useState(50)
  const editorPaneRef = useRef<HTMLDivElement>(null)
  // TODO -- Fix me
  // const editorRef = useRef<MonacoEditorNS.IStandaloneCodeEditor | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<any>(null)
  const monacoRef = useRef<Parameters<BeforeMount>[0] | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  // Off-DOM element that monaco-vim writes its status into – never appended to
  // the document so nothing is rendered to the user.
  const statusBarRef = useRef(document.createElement('div'))
  const vimModeInstanceRef = useRef<VimAdapterInstance | null>(null)

  // Keep a ref so Monaco keyboard shortcuts always call with latest pendingSource
  const pendingSourceRef = useRef(pendingSource)
  pendingSourceRef.current = pendingSource

	const { vimMode, fontSize, glslAutocomplete } = useAppStorage()
	const { currentTheme } = useTheme()

  // Expose loadExample imperatively (used by App when a GLSL example is selected)
  useImperativeHandle(ref, () => ({
    loadExample(title: string, content: string) {
      editorRef.current?.setValue(content)
      setPendingSource(content)
      saveGlslCode(content)
      setShaderTitle(title)
      saveGlslTitle(title)
      onRun(content)
    },
    run() {
      onRun(pendingSourceRef.current)
    },
    getTitle() {
      return shaderTitle
    },
    setTitle(title: string) {
      setShaderTitle(title)
      saveGlslTitle(title)
    },
    save() {
      if (onSave) {
        onSave(shaderTitle, pendingSourceRef.current)
      }
    },
    triggerImport() {
      fileInputRef.current?.click()
    },
    triggerExport() {
      const blob = new Blob([pendingSourceRef.current], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
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
    },
    toggleUniforms() {
      setUniformsOpen(v => !v)
    },
    closeUniforms() {
      setUniformsOpen(false)
    },
  }), [shaderTitle, onSave, onRun])

  // Enable / disable vim mode whenever the prop changes or the editor mounts
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

  // Update Monaco font size whenever it changes
  useEffect(() => {
    editorRef.current?.updateOptions({ fontSize })
  }, [fontSize])

  // Toggle Monaco autocomplete whenever the setting changes
  useEffect(() => {
    editorRef.current?.updateOptions({
      quickSuggestions: glslAutocomplete,
      suggestOnTriggerCharacters: glslAutocomplete,
      wordBasedSuggestions: glslAutocomplete ? 'currentDocument' : 'off',
    })
  }, [glslAutocomplete])

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

    // Register a GLSL keyword/function/variable completion provider.
    // The provider is always registered (registration happens once on mount),
    // and autocomplete is activated or suppressed via the quickSuggestions and
    // suggestOnTriggerCharacters options controlled by the glslAutocomplete setting.
    monaco.languages.registerCompletionItemProvider('glsl', {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      provideCompletionItems: (model: any, position: any) => {
        const word = model.getWordUntilPosition(position)
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        }
        const suggestions = [
          ...GLSL_MONARCH_TOKENS.keywords.map(kw => ({
            label: kw,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: kw,
            range,
          })),
          ...GLSL_MONARCH_TOKENS.typeKeywords.map(kw => ({
            label: kw,
            kind: monaco.languages.CompletionItemKind.Class,
            insertText: kw,
            range,
          })),
          ...GLSL_MONARCH_TOKENS.qualifiers.map(kw => ({
            label: kw,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: kw,
            range,
          })),
          ...GLSL_MONARCH_TOKENS.builtinFunctions.map(fn => ({
            label: fn,
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: fn,
            range,
          })),
          ...GLSL_MONARCH_TOKENS.builtinVariables.map(v => ({
            label: v,
            kind: monaco.languages.CompletionItemKind.Variable,
            insertText: v,
            range,
          })),
        ]
        return { suggestions }
      },
    })
  }, [])

  // Switch Monaco editor theme whenever the app theme changes
  useEffect(() => {
    monacoRef.current?.editor.setTheme(themeNameToMonaco(currentTheme.name))
  }, [currentTheme.name])

  const handleEditorMount = useCallback<OnMount>((editor) => {
    editorRef.current = editor
    // Initialize vim mode immediately if it is already enabled when the editor mounts
    if (vimMode && !vimModeInstanceRef.current) {
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
      setPendingSource(value)
      saveGlslCode(value)
    }
  }, [setPendingSource])

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setShaderTitle(e.target.value)
    saveGlslTitle(e.target.value)
  }, [])

  const handleSave = useCallback(() => {
    if (onSave) {
      onSave(shaderTitle, pendingSourceRef.current)
    }
  }, [onSave, shaderTitle])

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
        setPendingSource(content)
        saveGlslCode(content)
        // Set title from filename, stripping the extension
        const name = file.name.replace(/\.[^.]+$/, '')
        setShaderTitle(name)
        saveGlslTitle(name)
      }
    }
    reader.readAsText(file)
    // Reset so the same file can be re-imported
    e.target.value = ''
  }, [setPendingSource])

  /** Drag handler for the uniforms-split divider */
  const handleUniformsDividerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const pane = editorPaneRef.current
    if (!pane) return
    const startY = e.clientY
    const startRatio = uniformsSplitRatio
    const paneH = pane.getBoundingClientRect().height
    const onMove = (me: MouseEvent) => {
      const delta = me.clientY - startY
      const newRatio = Math.min(80, Math.max(20, startRatio + (delta / paneH) * 100))
      setUniformsSplitRatio(newRatio)
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [uniformsSplitRatio])

  return (
    <Box
      ref={editorPaneRef}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: 'background.panel',
        pt: hideHeader ? '44px' : 0,
      }}
    >
      {!hideHeader && (
        <ShaderHeader
          title={shaderTitle}
          onTitleChange={handleTitleChange}
          onImport={handleImportClick}
          onExport={handleExport}
          onSave={handleSave}
          onRun={handleRun}
          titleAriaLabel="Shader title"
          importAriaLabel="Import shader from file"
          exportAriaLabel="Export shader to file"
          runLabel="Run Shader"
          runColor="primary"
          onShowUniforms={() => setUniformsOpen(v => !v)}
          uniformsActive={uniformsOpen}
        />
      )}

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".glsl,.frag,.vert,.fs,.vs,.txt"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <ShaderError error={shaderError} />

      {/* Monaco editor – height shrinks to give space to the uniforms panel when open */}
      <Box sx={{
        flex: uniformsOpen ? undefined : 1,
        height: uniformsOpen ? `${uniformsSplitRatio}%` : undefined,
        overflow: 'hidden',
      }}>
        <Editor
          height="100%"
          defaultLanguage="glsl"
          defaultValue={pendingSource}
          onChange={handleEditorChange}
          beforeMount={handleBeforeMount}
          onMount={handleEditorMount}
          theme={themeNameToMonaco(currentTheme.name)}
          options={{
            minimap: { enabled: false },
            fontSize: fontSize,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            automaticLayout: true,
            quickSuggestions: glslAutocomplete,
            suggestOnTriggerCharacters: glslAutocomplete,
            wordBasedSuggestions: glslAutocomplete ? 'currentDocument' : 'off',
          }}
        />
      </Box>

      {/* Resizable divider and uniforms panel */}
      {uniformsOpen && (
        <>
          <Box
            onMouseDown={handleUniformsDividerMouseDown}
            sx={{
              height: '4px',
              bgcolor: 'border.faint',
              cursor: 'row-resize',
              flexShrink: 0,
              '&:hover': { bgcolor: 'border.faint' },
            }}
          />
          <Box sx={{ height: `${100 - uniformsSplitRatio}%`, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <UniformsPanel />
          </Box>
        </>
      )}
    </Box>
  )
})
