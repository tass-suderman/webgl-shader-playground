import { Box, ToggleButton, ToggleButtonGroup } from '@mui/material'
import { ViewMode, tabConfigs, getTabSx } from '../../constants/tabConfigs'

export interface TabBarProps {
	viewMode: ViewMode
	setViewMode: (mode: ViewMode) => void
	strudelRef: React.RefObject<{ closeSounds: () => void }>
}

export const TabBar = ({
	viewMode,
	setViewMode,
	strudelRef,
}: TabBarProps) => {
  return (
    <Box sx={{
      px: 1,
      py: 0.5,
      bgcolor: 'background.header',
      borderBottom: 'border.subtle',
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      gap: 1,
    }}>
      <ToggleButtonGroup
        value={viewMode}
        exclusive
        onChange={(_e, val: ViewMode | null) => {
          if (!val) return
          setViewMode(val)
          strudelRef.current?.closeSounds()
					// TODO --> Close Uniforms Panel (Issue #25)
        }}
        size="small"
        sx={{ flex: 1, minWidth: 0 }}
				children={
					tabConfigs.map(({ value, label, variant }) => (
						<ToggleButton
						key={value}
						value={value}
						sx={getTabSx(variant)}
						children={label}
						/>
					))
				}
      />
    </Box>
  )
}
