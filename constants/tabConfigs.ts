import { SxProps } from "@mui/material"

export type ViewMode = 'glsl' | 'strudel' | 'saved' | 'settings' | 'about'

type ButtonVariant = 'editor' | 'utility'

interface TabConfig {
	value: ViewMode
	label: string
	variant: ButtonVariant
}

const baseTabSx = {
  backgroundColor: 'background.button',
  borderRadius: '15px',
  fontSize: '0.75rem',
  py: 0.25,
  px: 1.5,
  textTransform: 'none',
  flex: 1,
	'&.Mui-selected:hover, &.Mui-selected': {
    backgroundColor: 'background.hover',
    color: 'textColor.hover',
  },
  '&:hover': {
    backgroundColor: 'background.hover',
    color: 'textColor.hover',
  },
} as SxProps;

const tabSxByVariant: Record<ButtonVariant, SxProps> = {
  // Editor mode tabs (GLSL / Strudel) – primary text colour
  editor: { ...baseTabSx, color: 'textColor.button'},
  // Utility tabs (Saved / Settings / About) – warm complementary text colour
  utility: { ...baseTabSx, color: 'textColor.utilTab' },
}

export const tabConfigs: TabConfig[] = [
	{ value: 'glsl', label: 'GLSL', variant: 'editor' },
	{ value: 'strudel', label: 'Strudel', variant: 'editor' },
	{ value: 'saved', label: 'Saved', variant: 'utility' },
	{ value: 'settings', label: 'Settings', variant: 'utility' },
	{ value: 'about', label: 'About', variant: 'utility' },
]

export const getTabSx = (variant: ButtonVariant) => tabSxByVariant[variant]

