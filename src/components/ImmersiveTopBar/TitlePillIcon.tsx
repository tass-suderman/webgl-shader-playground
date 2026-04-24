import { SvgIconComponent } from '@mui/icons-material';
import { Box } from '@mui/material';

export interface TitlePillIconProps {
	icon: SvgIconComponent
}

export const TitlePillIcon = ({ icon: Icon }: TitlePillIconProps) => {
  return (
    <Box sx={{ color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', mr: 0.5, flexShrink: 0 }}>
      <Icon />
    </Box>
  )
}
