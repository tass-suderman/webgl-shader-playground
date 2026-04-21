import { useCallback, useState } from 'react'
import { Box, Button, FormControl, MenuItem, Select, Typography} from '@mui/material'
import { DeleteForever } from '@mui/icons-material'
import ResetConfirmationDialog from '../ResetConfirmationDialog/ResetConfirmationDialog'
import SettingsDivider from '../SettingsDivider/SettingsDivider'
import SettingsSection from '../SettingsSection/SettingsSection'
import SettingsCheckbox from '../SettingsCheckbox/SettingsCheckbox'
import { shortcuts } from '../../utility/keyboardShortcuts'
import { useAppStorage } from '../../hooks/useAppStorage'

export default () => {
  const [resetDialogOpen, setResetDialogOpen] = useState(false)

  const handleResetConfirm = useCallback(() => {
    localStorage.clear()
    setResetDialogOpen(false)
    window.location.reload()
  }, [])

const {
vimMode, setVimMode,
fontSize, setFontSize,
warnOnOverwrite, setWarnOnOverwrite,
warnOnLoadExample, setWarnOnLoadExample,
warnOnLoadSaved, setWarnOnLoadSaved,
strudelAutocomplete, setStrudelAutocomplete,
glslAutocomplete, setGlslAutocomplete,
} = useAppStorage()

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
      {/* Pill gap */}
      <Box sx={{ pt: '44px' }} />

      {/* Settings content */}
      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>

        {/* ---- Editor ---- */}
<SettingsSection title="Editor">
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 1.5 }}>
            <SettingsCheckbox checked={vimMode} onChange={setVimMode} label="Vim keybindings" />
            <SettingsCheckbox checked={glslAutocomplete} onChange={setGlslAutocomplete} label="GLSL autocomplete" />
            <SettingsCheckbox checked={strudelAutocomplete} onChange={setStrudelAutocomplete} label="Strudel autocomplete" />
          </Box>
          <Box sx={{ mt: 1.5 }}>
            <Typography variant="body2" sx={{ mb: 0.75 }} children="Font size" />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
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
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <SettingsCheckbox checked={warnOnOverwrite} onChange={setWarnOnOverwrite} label="Warn before overwriting a saved entry" />
            <SettingsCheckbox checked={warnOnLoadSaved} onChange={setWarnOnLoadSaved} label="Warn before loading saved content" />
            <SettingsCheckbox checked={warnOnLoadExample} onChange={setWarnOnLoadExample} label="Warn before loading an example" />
          </Box>
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
