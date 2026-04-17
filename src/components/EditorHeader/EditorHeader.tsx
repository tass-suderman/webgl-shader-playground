import { Button, IconButton, InputBase, Tooltip } from '@mui/material'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import FileUploadIcon from '@mui/icons-material/FileUpload'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import MusicNoteIcon from '@mui/icons-material/MusicNote'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import SaveIcon from '@mui/icons-material/Save'
import StopIcon from '@mui/icons-material/Stop'
import PaneHeader from '../PaneHeader/PaneHeader'

export interface EditorHeaderProps {
  title: string
  onTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onImport: () => void
  onExport: () => void
  onSave: () => void
  onRun: () => void
  titleAriaLabel?: string
  importAriaLabel?: string
  exportAriaLabel?: string
  runLabel?: string
  runColor?: 'primary' | 'success'
  isPlaying?: boolean
  onStop?: () => void
  onShowSounds?: () => void
  soundsActive?: boolean
  onShowUniforms?: () => void
  uniformsActive?: boolean
}

export default function EditorHeader({
  title,
  onTitleChange,
  onImport,
  onExport,
  onSave,
  onRun,
  titleAriaLabel = 'Editor title',
  importAriaLabel = 'Import from file',
  exportAriaLabel = 'Export to file',
  runLabel = 'Run',
  runColor = 'primary',
  isPlaying,
  onStop,
  onShowSounds,
  soundsActive = false,
  onShowUniforms,
  uniformsActive = false,
}: EditorHeaderProps) {
  return (
    <PaneHeader>
      <InputBase
        value={title}
        onChange={onTitleChange}
        inputProps={{ 'aria-label': titleAriaLabel }}
        sx={{
          color: 'textColor.primary',
          fontFamily: 'monospace',
          fontSize: '0.875rem',
          flex: 1,
          minWidth: 0,
          '& input': { p: 0, cursor: 'text' },
        }}
      />

      {/* Sounds button – only for Strudel */}
      {onShowSounds && (
        <Tooltip title={soundsActive ? 'Hide sounds' : 'Available sounds'}>
          <IconButton
            size="small"
            onClick={onShowSounds}
            aria-label="Available sounds"
            sx={{ color: soundsActive ? 'accent' : 'textColor.primary' }}
          >
            <MusicNoteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}

      {/* Uniforms button – only for GLSL */}
      {onShowUniforms && (
        <Tooltip title={uniformsActive ? 'Hide uniforms' : 'Available uniforms'}>
          <IconButton size="small" onClick={onShowUniforms} aria-label="Available uniforms" sx={{ color: uniformsActive ? 'accent' : 'textColor.primary' }}>
            <InfoOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}

      {onSave && (
        <Tooltip title="Save to Saved tab">
          <IconButton size="small" onClick={onSave} aria-label="Save" sx={{ color: 'textColor.primary' }}>
            <SaveIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      <Tooltip title={importAriaLabel}>
        <IconButton size="small" onClick={onImport} aria-label={importAriaLabel} sx={{ color: 'textColor.primary' }}>
          <FileUploadIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title={exportAriaLabel}>
        <IconButton size="small" onClick={onExport} aria-label={exportAriaLabel} sx={{ color: 'textColor.primary' }}>
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
      {onStop && (
        <Button
          variant="outlined"
          color="error"
          size="small"
          startIcon={<StopIcon />}
          onClick={onStop}
          disabled={!isPlaying}
          sx={{ textTransform: 'none', flexShrink: 0, ':disabled': { borderColor: 'border.disabled', color: 'border.disabled' } }}
        >
          Stop
        </Button>
      )}
    </PaneHeader>
  )
}
