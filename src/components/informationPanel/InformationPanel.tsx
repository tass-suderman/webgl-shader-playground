import { Box } from '@mui/material';

export interface InformationPanelProps {
	renderer: (item: any) => React.ReactNode;
	items: readonly any[];
	footer: React.ReactNode;
}

export const InformationPanel = ({ renderer, items, footer}: InformationPanelProps) => {
	return (
    <Box
      sx={{
        flex: 1,
        overflow: 'auto',
        p: 2,
        bgcolor: 'background.panel',
        color: 'textColor.primary',
      }}
		>
			{items.map(renderer)}
			{footer}
    </Box>
	)
}
