import { Checkbox, FormControlLabel, Typography } from '@mui/material'

interface SettingsCheckboxProps {
	checked: boolean
	onChange: (checked: boolean) => void
	label: string
}

const SettingsCheckbox = ({ checked, onChange, label }: SettingsCheckboxProps) => (
	<FormControlLabel
		control={
			<Checkbox
				checked={checked}
				onChange={(e) => onChange(e.target.checked)}
				size="small"
				sx={{
					color: 'border.default',
					'&.Mui-checked': { color: 'accent' },
				}}
			/>
		}
		label={<Typography variant="body2">{label}</Typography>}
	/>
)

export default SettingsCheckbox
