import { TypeBackground as MuiTypeBackground, PaletteOptions as MuiPaletteOptions, Palette as MuiPalette } from '@mui/material';

declare module '@mui/material/styles'
{
	interface TypeBackground extends MuiTypeBackground {
		app: string
		panel: string
		header: string
		button: string
		card: string
		disabled: string
		hover: string
	}
	interface PaletteOptions extends MuiPaletteOptions {
		textColor: {
			primary: string
			muted: string
			button: string
			hover: string
			disabled: string
			utilTab: string
			sourceTab: string
		}
		border: {
			subtle: string
			faint: string
			default: string
			hover: string
			disabled: string
		}
		accent: string
	}
	interface Palette extends MuiPalette {
		textColor: {
			primary: string
			muted: string
			button: string
			hover: string
			disabled: string
			utilTab: string
			sourceTab: string
		}
		border: {
			subtle: string
			faint: string
			default: string
			hover: string
			disabled: string
		}
		accent: string
	}
}
