import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import InputBase from '@mui/material/InputBase'
import Tooltip from '@mui/material/Tooltip'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import FileUploadIcon from '@mui/icons-material/FileUpload'
import MusicNoteIcon from '@mui/icons-material/MusicNote'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import StopIcon from '@mui/icons-material/Stop'

interface StrudelHeaderProps {
  title: string
  isPlaying: boolean
  onTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onImport: () => void
  onExport: () => void
  onShowSounds: () => void
  onReset: () => void
  onPlay: () => void
  onStop: () => void
}

export default function StrudelHeader({
  title,
  isPlaying,
  onTitleChange,
  onImport,
  onExport,
  onShowSounds,
  onReset,
  onPlay,
  onStop,
}: StrudelHeaderProps) {
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
        inputProps={{ 'aria-label': 'Strudel pattern title' }}
        sx={{
          color: 'var(--pg-text-primary)',
          fontFamily: 'monospace',
          fontSize: '0.875rem',
          flex: 1,
          minWidth: 0,
          '& input': { p: 0, cursor: 'text' },
        }}
      />

      <Tooltip title="Import pattern from file">
        <IconButton size="small" onClick={onImport} aria-label="Import pattern from file" sx={{ color: 'var(--pg-text-primary)' }}>
          <FileUploadIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Export pattern to file">
        <IconButton size="small" onClick={onExport} aria-label="Export pattern to file" sx={{ color: 'var(--pg-text-primary)' }}>
          <FileDownloadIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Available sounds">
        <IconButton size="small" onClick={onShowSounds} aria-label="Available sounds" sx={{ color: 'var(--pg-text-primary)' }}>
          <MusicNoteIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Reset to default pattern">
        <IconButton size="small" onClick={onReset} aria-label="Reset to default pattern" sx={{ color: 'var(--pg-text-primary)' }}>
          <RestartAltIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Button
        variant="contained"
        color="success"
        size="small"
        startIcon={<PlayArrowIcon />}
        onClick={onPlay}
        sx={{ textTransform: 'none', flexShrink: 0 }}
      >
        Play Strudel
      </Button>
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
    </Box>
  )
}
