import { IconButton, Tooltip } from '@mui/material'

export interface ToggleIconButtonStateProps {
	icon: React.ReactNode
	label: string
	color: string
}

interface ToggleIconButtonProps {
	onClick: () => void
	checked: boolean
	inactiveProps: ToggleIconButtonStateProps
	activeProps: ToggleIconButtonStateProps
	disabled?: boolean
}

export const ToggleIconButton = ({
  onClick,
  checked,
  inactiveProps,
  activeProps,
}: ToggleIconButtonProps) => {
  const { icon, label, color } = checked ? activeProps : inactiveProps
  return (
    <Tooltip title={label}>
      <IconButton onClick={onClick} size="small" sx={{ color }} aria-label={label}>
        {icon}
      </IconButton>
    </Tooltip>
  )
}
