import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import InputBase from '@mui/material/InputBase'
import Tooltip from '@mui/material/Tooltip'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import FileUploadIcon from '@mui/icons-material/FileUpload'
import MusicNoteIcon from '@mui/icons-material/MusicNote'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import StopIcon from '@mui/icons-material/Stop'

export interface ShaderHeaderProps {
  title: string
  onTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onImport: () => void
  onExport: () => void
  onRun: () => void
  titleAriaLabel?: string
  importAriaLabel?: string
  exportAriaLabel?: string
  runLabel?: string
  runColor?: 'primary' | 'success'
  // Strudel-specific optional props
  isPlaying?: boolean
  onStop?: () => void
  onShowSounds?: () => void
}

export default function ShaderHeader({
  title,
  onTitleChange,
  onImport,
  onExport,
  onRun,
  titleAriaLabel = 'Editor title',
  importAriaLabel = 'Import from file',
  exportAriaLabel = 'Export to file',
  runLabel = 'Run',
  runColor = 'primary',
  isPlaying,
  onStop,
  onShowSounds,
}: ShaderHeaderProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 2,
        py: 1,
        bgcolor: 'var(--pg-bg-header)',
        borderBottom: '1px solid var(--pg-border-subtle)',
        flexShrink: 0,
        gap: 1,
      }}
    >
      <InputBase
        value={title}
        onChange={onTitleChange}
        inputProps={{ 'aria-label': titleAriaLabel }}
        sx={{
          color: 'var(--pg-text-primary)',
          fontFamily: 'monospace',
          fontSize: '0.875rem',
          flex: 1,
          minWidth: 0,
          '& input': { p: 0, cursor: 'text' },
        }}
      />

      {/* Sounds button – only for Strudel */}
      {onShowSounds && (
        <Tooltip title="Available sounds">
          <IconButton size="small" onClick={onShowSounds} aria-label="Available sounds" sx={{ color: 'var(--pg-text-primary)' }}>
            <MusicNoteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}

      <Tooltip title={importAriaLabel}>
        <IconButton size="small" onClick={onImport} aria-label={importAriaLabel} sx={{ color: 'var(--pg-text-primary)' }}>
          <FileUploadIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title={exportAriaLabel}>
        <IconButton size="small" onClick={onExport} aria-label={exportAriaLabel} sx={{ color: 'var(--pg-text-primary)' }}>
          <FileDownloadIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Button
        variant="contained"
        color={runColor}
        size="small"
        startIcon={<PlayArrowIcon />}
        onClick={onRun}
        sx={{ textTransform: 'none', flexShrink: 0 }}
      >
        {runLabel}
      </Button>

      {/* Stop button – only for Strudel */}
      {onStop !== undefined && (
        <Button
          variant="outlined"
          color="error"
          size="small"
          startIcon={<StopIcon />}
          onClick={onStop}
          disabled={!isPlaying}
          sx={{ textTransform: 'none', flexShrink: 0 }}
        >
          Stop
        </Button>
      )}
    </Box>
  )
}
