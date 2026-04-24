import { Folder, Info, MusicNote, Settings, SvgIconComponent, Tonality } from "@mui/icons-material"

export type ViewMode = 'glsl' | 'strudel' | 'saved' | 'settings' | 'about'

export interface TabConfig {
	value: ViewMode
	label: string
	title: string
	icon: SvgIconComponent
	editableTitleLabel?: string
}

export const tabConfigs: TabConfig[] = [
  { 
    value: 'glsl',
    label: 'GLSL',
    title: 'GLSL',
    editableTitleLabel: 'Shader title',
    icon:  Tonality 
  },
  { 
    value: 'strudel',
    label: 'Strudel',
    title: 'Strudel',
    editableTitleLabel: 'Pattern title',
    icon: MusicNote
  },
  { 
    value: 'saved',
    label: 'Saved',
    title: 'Saved Content & Examples',
    icon: Folder
  },
  { 
    value: 'settings',
    label: 'Settings',
    title: 'Settings',
    icon: Settings
  },
  { 
    value: 'about',
    label: 'About',
    title: 'About Shades & Waves',
    icon: Info
  },
]

