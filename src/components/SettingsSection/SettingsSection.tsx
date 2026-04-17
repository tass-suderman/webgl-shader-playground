import { Box, Typography } from '@mui/material';

export interface SettingsSectionProps {
	title: string;
	children: React.ReactNode;
}

const SettingsSection = ({ title, children }: SettingsSectionProps) => {
	return (
		<Box>
			<Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
				{title}
			</Typography>
			{children}
		</Box>
	)
}

export default SettingsSection;
