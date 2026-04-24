import { Box, IconButton, SxProps, Tooltip } from '@mui/material'
import { tabConfigs, ViewMode } from '../../utility/tabConfigs'

export interface TabsPillProps {
	viewMode: string
	handleTabSelect: (mode: ViewMode) => void
	sx: SxProps
}

const TabsPill = ({ viewMode, handleTabSelect, sx }: TabsPillProps) => {
  return (
    <Box sx={{ ...sx, px: 0.75, gap: 0, pointerEvents: 'auto' }}>
      {tabConfigs.map(({ value, label, icon: Icon }) => {
        const isActive = value === viewMode
        return (
          <Tooltip key={value} title={label} placement="bottom">
            <IconButton
              size="small"
              onClick={() => handleTabSelect(value)}
              sx={{
                color: isActive ? 'white' : 'rgba(255,255,255,0.4)',
                bgcolor: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
                borderRadius: '50%',
                '&:hover': {
                  color: 'white',
                  bgcolor: 'rgba(255,255,255,0.1)',
                },
                p: 0.5,
              }}
              aria-label={label}
              aria-pressed={isActive}
            >
              <Icon />
            </IconButton>
          </Tooltip>
        )
      })}
    </Box>
  )
}

export default TabsPill
