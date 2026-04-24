import { Box, IconButton, Slider, Tooltip } from '@mui/material'

interface SliderControlProps {
	icon: React.ReactNode
	value: number
	onChange: (value: number) => void
	min?: number
	max?: number
	step?: number
	label: string
	iconColor?: string
	disabled?: boolean
	onIconClick?: () => void
}

export const SliderControl = ({
  icon,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  iconColor = 'white',
  disabled = false,
  onIconClick,
}: SliderControlProps) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      {onIconClick ? (
        <Tooltip title={label}>
          <IconButton
            onClick={onIconClick}
            size="small"
            aria-label={label}
            sx={{ color: iconColor }}
          >
            {icon}
          </IconButton>
        </Tooltip>
      ) : (
        <Tooltip title={label}>
          <Box sx={{ color: iconColor, display: 'flex', alignItems: 'center', px: 0.5 }}>
            {icon}
          </Box>
        </Tooltip>
      )}
      <Slider
        value={value}
        onChange={(_e, val) => onChange(val as number)}
        min={min}
        max={max}
        step={step}
        size="small"
        aria-label={label}
        disabled={disabled}
        sx={{
          width: 80,
          color: 'white',
          '& .MuiSlider-thumb': { width: 12, height: 12 },
          '& .MuiSlider-rail': { opacity: 0.3 },
        }}
      />
    </Box>
  )
}

