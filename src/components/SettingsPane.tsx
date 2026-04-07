import { useCallback, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Typography from '@mui/material/Typography'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import { ALL_THEMES } from '../themes/appThemes'

interface SettingsPaneProps {
  vimMode: boolean
  onVimModeChange: (enabled: boolean) => void
  themeName: string
  onThemeChange: (name: string) => void
}

export default function SettingsPane({ vimMode, onVimModeChange, themeName, onThemeChange }: SettingsPaneProps) {
  const [resetDialogOpen, setResetDialogOpen] = useState(false)

  const handleResetConfirm = useCallback(() => {
    // Clear all localStorage to ensure third-party persistence (e.g. Strudel's
    // internal CodeMirror storage) is also removed along with app keys.
    localStorage.clear()
    setResetDialogOpen(false)
    window.location.reload()
  }, [])

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: 'var(--pg-bg-panel)',
        color: 'var(--pg-text-primary)',
        overflow: 'auto',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2,
          py: 1,
          bgcolor: 'var(--pg-bg-header)',
          borderBottom: '1px solid var(--pg-border-subtle)',
          flexShrink: 0,
        }}
      >
        <Typography variant="subtitle2" sx={{ color: 'var(--pg-text-primary)', fontFamily: 'monospace' }}>
          Settings
        </Typography>
      </Box>

      {/* Settings content */}
      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 480 }}>

        {/* ---- Reset Data ---- */}
        <Box>
          <Typography variant="body2" sx={{ color: 'var(--pg-text-primary)', fontWeight: 600, mb: 0.5 }}>
            Data
          </Typography>
          <Typography variant="caption" sx={{ color: 'var(--pg-text-muted)', display: 'block', mb: 1 }}>
            Remove all saved shaders, patterns, and preferences and restore the app to its default state.
          </Typography>
          <Button
            variant="outlined"
            color="error"
            size="small"
            startIcon={<DeleteForeverIcon />}
            onClick={() => setResetDialogOpen(true)}
            sx={{ textTransform: 'none' }}
          >
            Reset data
          </Button>
        </Box>

        <Divider sx={{ borderColor: 'var(--pg-border-faint)' }} />

        {/* ---- Vim keybindings ---- */}
        <Box>
          <Typography variant="body2" sx={{ color: 'var(--pg-text-primary)', fontWeight: 600, mb: 0.5 }}>
            Editor
          </Typography>
          <FormControlLabel
            control={
              <Checkbox
                checked={vimMode}
                onChange={(e) => onVimModeChange(e.target.checked)}
                size="small"
                sx={{
                  color: 'var(--pg-border-default)',
                  '&.Mui-checked': { color: 'var(--pg-accent)' },
                }}
              />
            }
            label={
              <Typography variant="body2" sx={{ color: 'var(--pg-text-primary)' }}>
                Vim keybindings
              </Typography>
            }
          />
        </Box>

        <Divider sx={{ borderColor: 'var(--pg-border-faint)' }} />

        {/* ---- Theme ---- */}
        <Box>
          <Typography variant="body2" sx={{ color: 'var(--pg-text-primary)', fontWeight: 600, mb: 1 }}>
            Theme
          </Typography>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel
              sx={{
                color: 'var(--pg-text-muted)',
                '&.Mui-focused': { color: 'var(--pg-accent)' },
              }}
            >
              Theme
            </InputLabel>
            <Select
              value={themeName}
              label="Theme"
              onChange={(e) => onThemeChange(e.target.value)}
              sx={{
                color: 'var(--pg-text-primary)',
                bgcolor: 'var(--pg-bg-button)',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'var(--pg-border-default)',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'var(--pg-border-hover)',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'var(--pg-accent)',
                },
                '& .MuiSvgIcon-root': {
                  color: 'var(--pg-text-muted)',
                },
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    bgcolor: 'var(--pg-bg-header)',
                    color: 'var(--pg-text-primary)',
                    border: '1px solid var(--pg-border-default)',
                  },
                },
              }}
            >
              {ALL_THEMES.map(t => (
                <MenuItem
                  key={t.name}
                  value={t.name}
                  sx={{
                    color: 'var(--pg-text-primary)',
                    '&:hover': { bgcolor: 'var(--pg-bg-button)' },
                    '&.Mui-selected': { bgcolor: 'var(--pg-bg-button)' },
                    '&.Mui-selected:hover': { bgcolor: 'var(--pg-divider-default)' },
                  }}
                >
                  {t.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Divider sx={{ borderColor: 'var(--pg-border-faint)' }} />

        {/* ---- Keyboard shortcuts ---- */}
        <Box>
          <Typography variant="body2" sx={{ color: 'var(--pg-text-primary)', fontWeight: 600, mb: 1 }}>
            Keyboard Shortcuts
          </Typography>
          {[
            { keys: 'Ctrl + Enter', desc: 'Run / compile GLSL shader' },
            { keys: 'Ctrl + .', desc: 'Pause shader animation' },
            { keys: 'Alt + Enter', desc: 'Play Strudel pattern' },
            { keys: 'Alt + .', desc: 'Pause Strudel pattern' },
          ].map(({ keys, desc }) => (
            <Box key={keys} sx={{ display: 'flex', gap: 2, mb: 0.75, alignItems: 'center' }}>
              <Typography
                variant="caption"
                sx={{
                  fontFamily: 'monospace',
                  color: 'var(--pg-text-primary)',
                  bgcolor: 'var(--pg-bg-button)',
                  px: 0.75,
                  py: 0.25,
                  borderRadius: 0.5,
                  border: '1px solid var(--pg-border-faint)',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  minWidth: 110,
                  display: 'inline-block',
                  textAlign: 'center',
                }}
              >
                {keys}
              </Typography>
              <Typography variant="caption" sx={{ color: 'var(--pg-text-muted)' }}>
                {desc}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Reset confirmation dialog */}
      <Dialog
        open={resetDialogOpen}
        onClose={() => setResetDialogOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: 'var(--pg-bg-header)',
            color: 'var(--pg-text-primary)',
            border: '1px solid var(--pg-border-default)',
          },
        }}
      >
        <DialogTitle sx={{ color: 'var(--pg-text-primary)' }}>Reset all data?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'var(--pg-text-muted)' }}>
            This will permanently delete all saved shaders, patterns, and preferences. The page will
            reload and everything will return to its default state. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setResetDialogOpen(false)}
            sx={{ color: 'var(--pg-text-muted)', textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleResetConfirm}
            color="error"
            variant="contained"
            sx={{ textTransform: 'none' }}
          >
            Reset
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
