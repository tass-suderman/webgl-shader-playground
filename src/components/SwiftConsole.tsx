import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import TerminalIcon from '@mui/icons-material/Terminal'

interface SwiftConsoleProps {
  output: string | null
  isRunning: boolean
  isError: boolean
  onClear: () => void
}

export default function SwiftConsole({ output, isRunning, isError, onClear }: SwiftConsoleProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#0d0d0d' }}>
      {/* Console header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          px: 2,
          py: 1,
          bgcolor: 'var(--pg-bg-header)',
          borderBottom: '1px solid var(--pg-border-subtle)',
          flexShrink: 0,
          gap: 1,
        }}
      >
        <TerminalIcon sx={{ fontSize: '1rem', color: 'var(--pg-text-muted)' }} />
        <Typography
          sx={{
            fontFamily: 'monospace',
            fontSize: '0.875rem',
            color: 'var(--pg-text-primary)',
            flex: 1,
          }}
        >
          Output Console
        </Typography>
        {isRunning && (
          <CircularProgress size={16} thickness={5} sx={{ color: 'var(--pg-accent)' }} />
        )}
        <Tooltip title="Clear output">
          <span>
            <IconButton
              size="small"
              onClick={onClear}
              disabled={!output && !isRunning}
              aria-label="Clear output"
              sx={{ color: 'var(--pg-text-primary)' }}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      {/* Console body */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 2,
          fontFamily: 'monospace',
          fontSize: '13px',
          lineHeight: 1.6,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {isRunning && !output ? (
          <Typography
            component="span"
            sx={{ fontFamily: 'monospace', fontSize: 'inherit', color: 'var(--pg-text-muted)', fontStyle: 'italic' }}
          >
            Running…
          </Typography>
        ) : output ? (
          <Typography
            component="span"
            sx={{
              fontFamily: 'monospace',
              fontSize: 'inherit',
              color: isError ? '#ff6b6b' : '#b8e7b8',
            }}
          >
            {output}
          </Typography>
        ) : (
          <Typography
            component="span"
            sx={{ fontFamily: 'monospace', fontSize: 'inherit', color: 'var(--pg-text-muted)', fontStyle: 'italic' }}
          >
            Ready. Press &quot;Run Swift&quot; to execute your program.
          </Typography>
        )}
      </Box>
    </Box>
  )
}
