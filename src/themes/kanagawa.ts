import { ThemeOptions } from '@mui/material';
import { Theme } from './Theme';

const kanagawaTheme: ThemeOptions = {
	palette: {
		background: {
			app: '#080F1D',
			panel: '#111620',
			header: '#1F1F28',
			button: '#363646',
			card: '#080F1D',
			disabled: '#2A2A3767',
			hover: '#A4B9EF',
		},
		textColor: {
			primary: '#FFFFFF',
			muted: '#A4B9EF',
			button: '#A4B9EF',
			hover: '#1F1F28',
			disabled: '#A4B9EF',
			utilTab: '#E6C384',
			sourceTab: '#FF9E8C',
		},
		border: {
			subtle: '#957FB840',
			faint: '#957FB81F',
			default: '#957FB8',
			hover: '#7AA89F',
			disabled: '#565575',
		},
		accent: '#A4B9EF',
	},
};

export default {
	name: 'kanagawa',
	label: 'Kanagawa',
	themeContent: kanagawaTheme,
} as Theme;
