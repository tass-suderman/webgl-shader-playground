import { Box } from '@mui/material';
import { UniformEntry } from '../shader/uniformsData';
import { SoundCategory } from '../strudel/soundCategories';

export interface InformationPanelProps {
	renderer: (item: UniformEntry|SoundCategory) => React.ReactNode;
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
