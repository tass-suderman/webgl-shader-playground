import { useCallback, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import InputBase from '@mui/material/InputBase'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import Editor from '@monaco-editor/react'
import type { OnMount } from '@monaco-editor/react'
import type { editor as MonacoEditorNS } from 'monaco-editor'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import FileUploadIcon from '@mui/icons-material/FileUpload'

interface EditorPaneProps {
  initialCode: string
  onRun: (code: string) => void
  pendingSource: string
  onCodeChange: (code: string) => void
  shaderError: string | null
}

export default function EditorPane({ initialCode, onRun, pendingSource, onCodeChange, shaderError }: EditorPaneProps) {
  const [shaderTitle, setShaderTitle] = useState('Fragment Shader (GLSL)')
  const editorRef = useRef<MonacoEditorNS.IStandaloneCodeEditor | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Keep a ref so Monaco keyboard shortcuts always call with latest pendingSource
  const pendingSourceRef = useRef(pendingSource)
  pendingSourceRef.current = pendingSource

  const handleRun = useCallback(() => {
    onRun(pendingSourceRef.current)
  }, [onRun])

  const handleEditorMount = useCallback<OnMount>((editor, monaco) => {
    editorRef.current = editor
    // Ctrl+Enter / Cmd+Enter and Alt+Enter both trigger Run Shader
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      onRun(pendingSourceRef.current)
    })
    editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.Enter, () => {
      onRun(pendingSourceRef.current)
    })
  }, [onRun])

  const handleEditorChange = useCallback((value: string | undefined) => {
    if (value !== undefined) {
      onCodeChange(value)
    }
  }, [onCodeChange])

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
        // Set title from filename, stripping the extension
        const name = file.name.replace(/\.[^.]+$/, '')
        setShaderTitle(name)
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
        bgcolor: '#1e1e1e',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1,
          bgcolor: '#252526',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          flexShrink: 0,
          gap: 1,
        }}
      >
        {/* Editable title */}
        <InputBase
          value={shaderTitle}
          onChange={e => setShaderTitle(e.target.value)}
          inputProps={{ 'aria-label': 'Shader title' }}
          sx={{
            color: 'rgba(255,255,255,0.7)',
            fontFamily: 'monospace',
            fontSize: '0.875rem',
            flex: 1,
            minWidth: 0,
            '& input': {
              p: 0,
              cursor: 'text',
            },
          }}
        />

        {/* Import / Export buttons */}
        <Tooltip title="Import shader from file">
          <IconButton size="small" onClick={handleImportClick} sx={{ color: 'rgba(255,255,255,0.7)' }}>
            <FileUploadIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Export shader to file">
          <IconButton size="small" onClick={handleExport} sx={{ color: 'rgba(255,255,255,0.7)' }}>
            <FileDownloadIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Button
          variant="contained"
          color="primary"
          size="small"
          startIcon={<PlayArrowIcon />}
          onClick={handleRun}
          sx={{ textTransform: 'none', flexShrink: 0 }}
        >
          Run Shader
        </Button>
      </Box>

      {/* Keyboard shortcut hint */}
      <Box sx={{ px: 2, py: 0.5, bgcolor: '#252526', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace' }}>
          Ctrl+Enter or Alt+Enter to run shader
        </Typography>
      </Box>

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".glsl,.frag,.vert,.fs,.vs,.txt"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Error display */}
      {shaderError && (
        <Box
          sx={{
            px: 2,
            py: 1,
            bgcolor: '#5a0000',
            borderBottom: '1px solid #ff0000',
            flexShrink: 0,
          }}
        >
          <Typography
            variant="caption"
            sx={{ color: '#ff8080', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}
          >
            {shaderError}
          </Typography>
        </Box>
      )}

      {/* Monaco editor */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <Editor
          height="100%"
          defaultLanguage="glsl"
          defaultValue={initialCode}
          onChange={handleEditorChange}
          onMount={handleEditorMount}
          theme="vs-dark"
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
}
