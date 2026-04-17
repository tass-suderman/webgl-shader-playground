import { Box } from '@mui/material';
import { UniformEntry } from '../../utility/shader/uniformsData';
import { SoundCategory } from '../../utility/strudel/soundCategories';

export interface InformationPanelProps {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	renderer: any;
	items: readonly (UniformEntry|SoundCategory)[];
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
