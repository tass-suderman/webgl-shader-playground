import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Editor from '@monaco-editor/react'
import type { OnMount, BeforeMount } from '@monaco-editor/react'
import { initVimMode, type VimAdapterInstance } from 'monaco-vim'
import ShaderHeader from './ShaderHeader'
import { ensureMonacoThemes, themeNameToMonaco } from './editor/monacoThemes'

const LS_SWIFT_CODE = 'shader-playground:swift-code'
const LS_SWIFT_TITLE = 'shader-playground:swift-title'
const DEFAULT_SWIFT_TITLE = 'Swift Program'

const DEFAULT_SWIFT_CODE = `import Foundation

// Press "Run Swift" (or Ctrl+Enter) to execute
print("Hello, World!")

let numbers = [1, 2, 3, 4, 5]
let sum = numbers.reduce(0, +)
print("Sum of \\(numbers) = \\(sum)")
`

// Piston API – free public code execution service
const PISTON_URL = 'https://emkc.org/api/v2/piston/execute'

interface SwiftPaneProps {
  onOutput: (output: string, isError: boolean) => void
  onRunningChange: (running: boolean) => void
  vimMode: boolean
  themeName: string
}

export interface SwiftPaneHandle {
  run: () => void
}

export default forwardRef<SwiftPaneHandle, SwiftPaneProps>(function SwiftPane(
  { onOutput, onRunningChange, vimMode, themeName },
  ref,
) {
  const [swiftTitle, setSwiftTitle] = useState(
    () => localStorage.getItem(LS_SWIFT_TITLE) ?? DEFAULT_SWIFT_TITLE,
  )
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<any>(null)
  const monacoRef = useRef<Parameters<BeforeMount>[0] | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const statusBarRef = useRef(document.createElement('div'))
  const vimModeInstanceRef = useRef<VimAdapterInstance | null>(null)
  const codeRef = useRef<string>(localStorage.getItem(LS_SWIFT_CODE) ?? DEFAULT_SWIFT_CODE)

  const onOutputRef = useRef(onOutput)
  onOutputRef.current = onOutput
  const onRunningChangeRef = useRef(onRunningChange)
  onRunningChangeRef.current = onRunningChange

  const executeSwift = useCallback(async () => {
    const code = codeRef.current
    onRunningChangeRef.current(true)
    try {
      const response = await fetch(PISTON_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: 'swift',
          version: '*',
          files: [{ content: code }],
        }),
      })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      const data = await response.json()
      const output = [data.run.stdout, data.run.stderr].filter(Boolean).join('\n').trimEnd() || '(no output)'
      const isError = data.run.code !== 0
      onOutputRef.current(output, isError)
    } catch (err) {
      onOutputRef.current(
        `Failed to execute: ${err instanceof Error ? err.message : String(err)}`,
        true,
      )
    } finally {
      onRunningChangeRef.current(false)
    }
  }, [])

  useImperativeHandle(ref, () => ({
    run: executeSwift,
  }), [executeSwift])

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

  const handleBeforeMount = useCallback<BeforeMount>((monaco) => {
    monacoRef.current = monaco
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

  const handleEditorChange = useCallback((value: string | undefined) => {
    if (value !== undefined) {
      codeRef.current = value
      localStorage.setItem(LS_SWIFT_CODE, value)
    }
  }, [])

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSwiftTitle(e.target.value)
    localStorage.setItem(LS_SWIFT_TITLE, e.target.value)
  }, [])

  const handleExport = useCallback(() => {
    const blob = new Blob([codeRef.current], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const safeName = swiftTitle
      .replace(/[^\w\s.-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^[_\s]+|[_\s]+$/g, '')
      .trim() || 'program'
    a.download = safeName + '.swift'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [swiftTitle])

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
        editorRef.current?.setValue(content)
        codeRef.current = content
        localStorage.setItem(LS_SWIFT_CODE, content)
        const name = file.name.replace(/\.[^.]+$/, '')
        setSwiftTitle(name)
        localStorage.setItem(LS_SWIFT_TITLE, name)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }, [])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'var(--pg-bg-panel)' }}>
      <ShaderHeader
        title={swiftTitle}
        onTitleChange={handleTitleChange}
        onImport={handleImportClick}
        onExport={handleExport}
        onRun={executeSwift}
        titleAriaLabel="Swift program title"
        importAriaLabel="Import Swift file"
        exportAriaLabel="Export Swift file"
        runLabel="Run Swift"
        runColor="primary"
      />

      <input
        ref={fileInputRef}
        type="file"
        accept=".swift,.txt"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <Editor
          height="100%"
          defaultLanguage="swift"
          defaultValue={localStorage.getItem(LS_SWIFT_CODE) ?? DEFAULT_SWIFT_CODE}
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
    </Box>
  )
})
