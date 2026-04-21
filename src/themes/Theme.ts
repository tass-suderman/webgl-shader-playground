import { ThemeOptions } from '@mui/material/styles';
import kanagawa from './kanagawa';

export interface Theme {
	name: string;
	label: string;
	themeContent: ThemeOptions;
}

export const themes: Theme[] = [
	kanagawa,
];
