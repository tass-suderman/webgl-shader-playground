import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, drawSelection } from '@codemirror/view'
import { EditorState, Compartment } from '@codemirror/state'
import { defaultKeymap, historyKeymap, history } from '@codemirror/commands'
import { bracketMatching, indentOnInput } from '@codemirror/language'
import { autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap } from '@codemirror/autocomplete'
import { vim } from '@replit/codemirror-vim'
import ShaderHeader from '../EditorHeader/EditorHeader'
import ShaderError from '../ShaderError/ShaderError'
import UniformsPanel from '../UniformsPanel/UniformsPanel'
import { glslLanguage, glslCompletions } from '../../utility/shader/glslCodemirror'
import { getGlslThemeExtension } from '../../utility/shader/codemirrorThemes'
import { saveGlslCode, saveGlslTitle, getInitialGlslCode, getInitialGlslTitle, useAppStorage } from '../../hooks/useAppStorage'
import { useTheme } from '../../hooks/useTheme'

const DEFAULT_SHADER_TITLE = 'Fragment Shader (GLSL)'

interface EditorPaneProps {
  onRun: (code: string) => void
  shaderError: string | null
  onSave: (title: string, content: string) => void
}

export interface EditorPaneHandle {
  loadExample: (title: string, content: string) => void
  run: () => void
  closeUniforms: () => void
}

export default forwardRef<EditorPaneHandle, EditorPaneProps>(function EditorPane(
  { onRun, shaderError, onSave },
  ref,
) {
  const [shaderTitle, setShaderTitle] = useState(
    () => getInitialGlslTitle(DEFAULT_SHADER_TITLE),
  )
  const [uniformsOpen, setUniformsOpen] = useState(false)
  const [uniformsSplitRatio, setUniformsSplitRatio] = useState(50)
  const editorPaneRef = useRef<HTMLDivElement>(null)
  const cmRootRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Compartments allow dynamic reconfiguration of individual extensions
  const themeCompartment = useRef(new Compartment())
  const vimCompartment = useRef(new Compartment())
  const fontSizeCompartment = useRef(new Compartment())
  const autocompleteCompartment = useRef(new Compartment())

  // Keep a ref to always have the latest source without stale closures
  const pendingSourceRef = useRef(getInitialGlslCode())

  // Keep a ref to the latest onRun so the keymap closure never goes stale
  const onRunRef = useRef(onRun)
  onRunRef.current = onRun

  const { vimMode, fontSize, glslAutocomplete } = useAppStorage()
  const { currentTheme } = useTheme()

  // Capture initial values in refs so the mount effect only runs once
  const vimModeRef = useRef(vimMode)
  vimModeRef.current = vimMode
  const fontSizeRef = useRef(fontSize)
  fontSizeRef.current = fontSize
  const themeNameRef = useRef(currentTheme.name)
  themeNameRef.current = currentTheme.name
  const glslAutocompleteRef = useRef(glslAutocomplete)
  glslAutocompleteRef.current = glslAutocomplete

  // ---------------------------------------------------------------------------
  // Mount the CodeMirror EditorView exactly once
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!cmRootRef.current) return

    const state = EditorState.create({
      doc: pendingSourceRef.current,
      extensions: [
        // Core editing features
        history(),
        drawSelection(),
        lineNumbers(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        bracketMatching(),
        closeBrackets(),
        indentOnInput(),
        EditorView.lineWrapping,

        // GLSL language
        glslLanguage,

        // Keymaps
        keymap.of([
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...historyKeymap,
          ...completionKeymap,
        ]),

        // Change listener – keep ref in sync and persist to localStorage
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const value = update.state.doc.toString()
            pendingSourceRef.current = value
            saveGlslCode(value)
          }
        }),

        // Dynamic compartments (theme / vim / font size / autocomplete)
        themeCompartment.current.of(getGlslThemeExtension(themeNameRef.current)),
        vimCompartment.current.of(vimModeRef.current ? vim() : []),
        fontSizeCompartment.current.of(
          EditorView.theme({ '&': { fontSize: `${fontSizeRef.current}px` } }),
        ),
        autocompleteCompartment.current.of(
          glslAutocompleteRef.current ? autocompletion({ override: [glslCompletions] }) : [],
        ),
      ],
    })

    const view = new EditorView({ state, parent: cmRootRef.current })
    viewRef.current = view

    return () => {
      view.destroy()
      viewRef.current = null
    }
  }, [])

  // ---------------------------------------------------------------------------
  // Imperative handle – load an example, run, or close uniforms
  // ---------------------------------------------------------------------------
  useImperativeHandle(ref, () => ({
    loadExample(title: string, content: string) {
      const view = viewRef.current
      if (view) {
        view.dispatch({
          changes: { from: 0, to: view.state.doc.length, insert: content },
        })
      }
      pendingSourceRef.current = content
      saveGlslCode(content)
      setShaderTitle(title)
      saveGlslTitle(title)
      onRunRef.current(content)
    },
    run() {
      onRunRef.current(pendingSourceRef.current)
    },
    closeUniforms() {
      setUniformsOpen(false)
    },
  }), [])

  // ---------------------------------------------------------------------------
  // Reconfigure vim mode dynamically
  // ---------------------------------------------------------------------------
  useEffect(() => {
    viewRef.current?.dispatch({
      effects: vimCompartment.current.reconfigure(vimMode ? vim() : []),
    })
  }, [vimMode])

  // ---------------------------------------------------------------------------
  // Reconfigure font size dynamically
  // ---------------------------------------------------------------------------
  useEffect(() => {
    viewRef.current?.dispatch({
      effects: fontSizeCompartment.current.reconfigure(
        EditorView.theme({ '&': { fontSize: `${fontSize}px` } }),
      ),
    })
  }, [fontSize])

  // ---------------------------------------------------------------------------
  // Reconfigure theme dynamically
  // ---------------------------------------------------------------------------
  useEffect(() => {
    viewRef.current?.dispatch({
      effects: themeCompartment.current.reconfigure(
        getGlslThemeExtension(currentTheme.name),
      ),
    })
  }, [currentTheme.name])

  // ---------------------------------------------------------------------------
  // Reconfigure autocomplete dynamically
  // ---------------------------------------------------------------------------
  useEffect(() => {
    viewRef.current?.dispatch({
      effects: autocompleteCompartment.current.reconfigure(
        glslAutocomplete ? autocompletion({ override: [glslCompletions] }) : [],
      ),
    })
  }, [glslAutocomplete])

  // ---------------------------------------------------------------------------
  // Callbacks
  // ---------------------------------------------------------------------------
  const handleRun = useCallback(() => {
    onRunRef.current(pendingSourceRef.current)
  }, [])

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setShaderTitle(e.target.value)
    saveGlslTitle(e.target.value)
  }, [])

  const handleSave = useCallback(() => {
    onSave(shaderTitle, pendingSourceRef.current)
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
        const view = viewRef.current
        if (view) {
          view.dispatch({
            changes: { from: 0, to: view.state.doc.length, insert: content },
          })
        }
        pendingSourceRef.current = content
        saveGlslCode(content)
        const name = file.name.replace(/\.[^.]+$/, '')
        setShaderTitle(name)
        saveGlslTitle(name)
      }
    }
    reader.readAsText(file)
    // Reset so the same file can be re-imported
    e.target.value = ''
  }, [])

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
      }}
    >
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

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".glsl,.frag,.vert,.fs,.vs,.txt"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <ShaderError error={shaderError} />

      {/* CodeMirror editor – height shrinks to give space to the uniforms panel when open */}
      <Box
        ref={cmRootRef}
        onClick={() => viewRef.current?.focus()}
        sx={{
          flex: uniformsOpen ? undefined : 1,
          height: uniformsOpen ? `${uniformsSplitRatio}%` : undefined,
          overflow: 'hidden',
          cursor: 'text',
          '& .cm-editor': { height: '100%' },
          '& .cm-scroller': { overflow: 'auto !important' },
        }}
      />

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
