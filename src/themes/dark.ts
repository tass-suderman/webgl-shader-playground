import { ThemeOptions } from '@mui/material';
import { Theme } from './Theme';

const darkTheme: ThemeOptions = {
	palette: {
		background: {
			app: '#1a1a2e',
			panel: '#1e1e1e',
			header: '#252526',
			button: '#3c3c3c',
			card: '#1e1e1e',
			disabled: 'rgba(60,60,60,0.4)',
			hover: '#FFFFFF1A',
		},
		textColor: {
			primary: 'rgba(255,255,255,0.7)',
			muted: 'rgba(255,255,255,0.35)',
			button: 'rgba(255,255,255,0.7)',
			hover: '#ffffff',
			disabled: 'rgba(255,255,255,0.35)',
			utilTab: 'rgba(230,195,110,0.85)',
			sourceTab: 'rgba(255,150,120,0.85)',
		},
		border: {
			subtle: 'rgba(255,255,255,0.1)',
			faint: 'rgba(255,255,255,0.05)',
			default: '#FFFFFF1A',
			hover: 'rgba(255,255,255,0.5)',
			disabled: 'rgba(255,255,255,0.15)',
		},
		accent: 'rgba(255,255,255,0.5)',
	},
};

export default {
	name: 'original-dark',
	label: 'Dark',
	themeContent: darkTheme,
} as Theme;
