import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import InputBase from '@mui/material/InputBase'
import Tooltip from '@mui/material/Tooltip'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import FileUploadIcon from '@mui/icons-material/FileUpload'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import RestartAltIcon from '@mui/icons-material/RestartAlt'

export interface EditorHeaderProps {
  title: string
  onTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onImport: () => void
  onExport: () => void
  onReset: () => void
  onRun: () => void
  titleAriaLabel?: string
  importAriaLabel?: string
  exportAriaLabel?: string
  resetAriaLabel?: string
  runLabel?: string
  runColor?: 'primary' | 'success'
}

export default function EditorHeader({
  title,
  onTitleChange,
  onImport,
  onExport,
  onReset,
  onRun,
  titleAriaLabel = 'Editor title',
  importAriaLabel = 'Import from file',
  exportAriaLabel = 'Export to file',
  resetAriaLabel = 'Reset to default',
  runLabel = 'Run',
  runColor = 'primary',
}: EditorHeaderProps) {
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
      <Tooltip title={resetAriaLabel}>
        <IconButton size="small" onClick={onReset} aria-label={resetAriaLabel} sx={{ color: 'var(--pg-text-primary)' }}>
          <RestartAltIcon fontSize="small" />
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
    </Box>
  )
}
