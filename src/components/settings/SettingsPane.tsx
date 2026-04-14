import { useCallback, useState } from 'react'
import { Box, Button, Checkbox, FormControl, FormControlLabel, MenuItem, Select, Typography} from '@mui/material'
import { DeleteForever } from '@mui/icons-material'
import { themes } from '../../themes/Theme'
import ResetConfirmationDialog from './ResetConfirmationDialog'
import SettingsDivider from './SettingsDivider'
import SettingsSection from './SettingsSection'
import { shortcuts } from './keyboardShortcuts'

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
        <Typography variant="subtitle2" sx={{ fontFamily: 'monospace' }} children="Settings" />
      </Box>

      {/* Settings content */}
      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>

        {/* ---- Editor ---- */}
				<SettingsSection title="Editor">
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
            label={ <Typography variant="body2" children="Vim keybindings" /> }
          />
          <Box sx={{ mt: 1.5 }}>
            <Typography variant="body2" sx={{ mb: 0.75 }} children="Font size" />
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
				</SettingsSection>

				<SettingsDivider />

				<SettingsSection title="Theme">
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
									children={t.label}
                />
              ))}
            </Select>
          </FormControl>
				</SettingsSection>

				<SettingsDivider />

        {/* ---- Keyboard shortcuts ---- */}
				<SettingsSection title="Keyboard Shortcuts">
          {shortcuts.map(({ keys, desc }) => (
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
								children={keys}
              />
              <Typography variant="caption" sx={{ color: 'textColor.muted' }} children={desc} />
            </Box>
          ))}
				</SettingsSection>

				<SettingsDivider />
				<SettingsSection title="Saved Content">
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
              <Typography variant="body2" children="Warn before overwriting a saved entry" />
            }
          />
				</SettingsSection>

				<SettingsDivider />

        {/* ---- Reset Data ---- */}
				<SettingsSection title="Data">
          <Typography variant="caption" sx={{ color: 'textColor.muted', display: 'block', mb: 1 }} children="Remove all saved shaders, patterns, and preferences and restore the app to its default state." />
          <Button
            variant="outlined"
            color="error"
            size="small"
            startIcon={<DeleteForever />}
            onClick={() => setResetDialogOpen(true)}
            sx={{ textTransform: 'none' }}
						children="Reset data"
          />
				</SettingsSection>
      </Box>

			<ResetConfirmationDialog open={resetDialogOpen} onCancel={() => setResetDialogOpen(false)} onConfirm={handleResetConfirm} />
    </Box>
  )
}
