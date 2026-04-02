import { useCallback } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Editor from '@monaco-editor/react'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'

interface EditorPaneProps {
  initialCode: string
  onRun: (code: string) => void
  pendingSource: string
  onCodeChange: (code: string) => void
  shaderError: string | null
}

export default function EditorPane({ initialCode, onRun, pendingSource, onCodeChange, shaderError }: EditorPaneProps) {
  const handleRun = useCallback(() => {
    onRun(pendingSource)
  }, [pendingSource, onRun])

  const handleEditorChange = useCallback((value: string | undefined) => {
    if (value !== undefined) {
      onCodeChange(value)
    }
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
        }}
      >
        <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace' }}>
          Fragment Shader (GLSL)
        </Typography>
        <Button
          variant="contained"
          color="primary"
          size="small"
          startIcon={<PlayArrowIcon />}
          onClick={handleRun}
          sx={{ textTransform: 'none' }}
        >
          Run Shader
        </Button>
      </Box>

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
