import { ThemeOptions } from '@mui/material/styles';
import kanagawa from './kanagawa';
import dark from './dark';

export interface Theme {
	name: string;
	label: string;
	themeContent: ThemeOptions;
}

export const themes: Theme[] = [
	kanagawa,
	dark,
];
