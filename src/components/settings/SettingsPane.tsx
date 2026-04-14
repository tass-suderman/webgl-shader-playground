import { useCallback, useState } from 'react'
import { Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider, FormControl, FormControlLabel, MenuItem, Select, Typography} from '@mui/material'
import { DeleteForever } from '@mui/icons-material'
import { themes } from '../../themes/Theme'

interface SettingsPaneProps {
  vimMode: boolean
  onVimModeChange: (enabled: boolean) => void
  themeName: string
  onThemeChange: (name: string) => void
  fontSize: number
  onFontSizeChange: (size: number) => void
  warnOnOverwrite: boolean
  onWarnOnOverwriteChange: (v: boolean) => void
}

export default function SettingsPane({ vimMode, onVimModeChange, themeName, onThemeChange, fontSize, onFontSizeChange, warnOnOverwrite, onWarnOnOverwriteChange }: SettingsPaneProps) {
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
        bgcolor: 'background.panel',
        color: 'textColor.primary',
        overflow: 'auto',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2,
          py: 1,
          bgcolor: 'background.header',
					borderColor: 'border.subtle',
          borderBottom: '1px solid',
          flexShrink: 0,
        }}
      >
        <Typography variant="subtitle2" sx={{ fontFamily: 'monospace' }}>
          Settings
        </Typography>
      </Box>

      {/* Settings content */}
      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>

        {/* ---- Editor ---- */}
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
            Editor
          </Typography>
          <FormControlLabel
            control={
              <Checkbox
                checked={vimMode}
                onChange={(e) => onVimModeChange(e.target.checked)}
                size="small"
                sx={{
                  color: 'border.default',
                  '&.Mui-checked': { color: 'accent' },
                }}
              />
            }
            label={
              <Typography variant="body2">
                Vim keybindings
              </Typography>
            }
          />
          <Box sx={{ mt: 1.5 }}>
            <Typography variant="body2" sx={{ mb: 0.75 }}>
              Font size
            </Typography>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select
                value={fontSize}
                onChange={(e) => onFontSizeChange(Number(e.target.value))}
                sx={{
                  color: 'textColor.primary',
                  bgcolor: 'background.button',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'border.default' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'border.hover' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'accent' },
                  '& .MuiSvgIcon-root': { color: 'textColor.muted' },
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      bgcolor: 'background.header',
                      color: 'textColor.primary',
											borderColor: 'border.default',
                      border: '1px solid',
                    },
                  },
                }}
              >
                {[11, 12, 13, 14, 16, 18, 20].map(size => (
                  <MenuItem
                    key={size}
                    value={size}
                    sx={{
                      color: 'textColor.primary',
                      '&:hover': { bgcolor: 'background.button' },
                      '&.Mui-selected': { bgcolor: 'background.button' },
                      '&.Mui-selected:hover': { bgcolor: 'border.faint' },
                    }}
                  >
                    {size}px
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>

        <Divider sx={{ borderColor: 'border.faint' }} />
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
            Theme
          </Typography>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <Select
              value={themeName}
              onChange={(e) => onThemeChange(e.target.value)}
              sx={{
                color: 'textColor.primary',
                bgcolor: 'background.button',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'border.default',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'border.hover',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'accent',
                },
                '& .MuiSvgIcon-root': {
                  color: 'textColor.muted',
                },
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    bgcolor: 'background.header',
                    color: 'textColor.primary',
										borderColor: 'border.default',
                    border: '1px solid',
                  },
                },
              }}
            >
              {themes.map(t => (
                <MenuItem
                  key={t.name}
                  value={t.name}
                  sx={{
                    color: 'textColor.primary',
                    '&:hover': { bgcolor: 'background.button' },
                    '&.Mui-selected': { bgcolor: 'background.button' },
                    '&.Mui-selected:hover': { bgcolor: 'border.faint' },
                  }}
                >
                  {t.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Divider sx={{ borderColor: 'border.faint' }} />

        {/* ---- Keyboard shortcuts ---- */}
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
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
                  bgcolor: 'background.button',
                  px: 0.75,
                  py: 0.25,
                  borderRadius: 0.5,
                  border: '1px solid',
									borderColor: 'border.faint',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  minWidth: 110,
                  display: 'inline-block'
                }}
              >
                {keys}
              </Typography>
              <Typography variant="caption" sx={{ color: 'textColor.muted' }}>
                {desc}
              </Typography>
            </Box>
          ))}
        </Box>

        <Divider sx={{ borderColor: 'border.faint' }} />

        {/* ---- Saved Content ---- */}
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
            Saved Content
          </Typography>
          <FormControlLabel
            control={
              <Checkbox
                checked={warnOnOverwrite}
                onChange={(e) => onWarnOnOverwriteChange(e.target.checked)}
                size="small"
                sx={{
                  color: 'border.default',
                  '&.Mui-checked': { color: 'accent' },
                }}
              />
            }
            label={
              <Typography variant="body2">
                Warn before overwriting a saved entry
              </Typography>
            }
          />
        </Box>

        <Divider sx={{ borderColor: 'border.faint' }} />

        {/* ---- Reset Data ---- */}
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
            Data
          </Typography>
          <Typography variant="caption" sx={{ color: 'textColor.muted', display: 'block', mb: 1 }}>
            Remove all saved shaders, patterns, and preferences and restore the app to its default state.
          </Typography>
          <Button
            variant="outlined"
            color="error"
            size="small"
            startIcon={<DeleteForever />}
            onClick={() => setResetDialogOpen(true)}
            sx={{ textTransform: 'none' }}
          >
            Reset data
          </Button>
        </Box>
      </Box>

      {/* Reset confirmation dialog */}
      <Dialog
        open={resetDialogOpen}
        onClose={() => setResetDialogOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: 'background.header',
            color: 'textColor.primary',
            border: '1px solid',
						borderColor: 'border.default',
          },
        }}
      >
        <DialogTitle sx={{ color: 'textColor.primary' }}>Reset all data?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'textColor.muted' }}>
            This will permanently delete all saved shaders, patterns, and preferences — including all entries in the Saved Content section. The page will
            reload and everything will return to its default state. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setResetDialogOpen(false)}
            sx={{ color: 'textColor.muted', textTransform: 'none' }}
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
