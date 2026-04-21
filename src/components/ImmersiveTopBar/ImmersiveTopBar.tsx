import { useEffect, useState } from 'react'
import {
Box,
IconButton,
InputBase,
Tooltip,
Typography,
useMediaQuery,
useTheme,
} from '@mui/material'
import TabIcon from '@mui/icons-material/Tab'
import MusicNoteIcon from '@mui/icons-material/MusicNote'
import FolderIcon from '@mui/icons-material/Folder'
import SettingsIcon from '@mui/icons-material/Settings'
import InfoIcon from '@mui/icons-material/Info'
import FileUploadIcon from '@mui/icons-material/FileUpload'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import SaveIcon from '@mui/icons-material/Save'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import StopIcon from '@mui/icons-material/Stop'
import MenuIcon from '@mui/icons-material/Menu'
import CloseIcon from '@mui/icons-material/Close'
import { type ViewMode, tabConfigs } from '../../constants/tabConfigs'
import { type EditorPaneHandle } from '../EditorPane/EditorPane'
import { type StrudelPaneHandle } from '../StrudelPane/StrudelPane'
import { getInitialGlslTitle, getInitialStrudelTitle, useAppStorage } from '../../hooks/useAppStorage'

const DEFAULT_GLSL_TITLE = 'Fragment Shader (GLSL)'
const DEFAULT_STRUDEL_TITLE = 'Strudel Pattern'

const TAB_ICONS: Record<ViewMode, React.ReactElement> = {
glsl: <TabIcon fontSize="small" />,
strudel: <MusicNoteIcon fontSize="small" />,
saved: <TabIcon fontSize="small" />,
settings: <TabIcon fontSize="small" />,
about: <TabIcon fontSize="small" />,
}

const TAB_LABELS: Record<ViewMode, string> = {
glsl: 'GLSL',
strudel: 'Strudel',
saved: 'Saved',
settings: 'Settings',
about: 'About Shades & Waves',
}

// Icons shown in the left pill for each view mode (for display only — not tab switching)
const LEFT_PILL_ICONS: Record<ViewMode, React.ReactElement> = {
glsl: <TabIcon fontSize="small" />,
strudel: <MusicNoteIcon fontSize="small" />,
saved: <FolderIcon fontSize="small" />,
settings: <SettingsIcon fontSize="small" />,
about: <InfoIcon fontSize="small" />,
}

interface ImmersiveTopBarProps {
viewMode: ViewMode
setViewMode: (mode: ViewMode) => void
strudelRef: React.RefObject<StrudelPaneHandle>
editorRef: React.RefObject<EditorPaneHandle>
}

export const ImmersiveTopBar = ({
viewMode,
setViewMode,
strudelRef,
editorRef,
}: ImmersiveTopBarProps) => {
const { immersiveOpacity } = useAppStorage()
const opacity = Math.min(1, Math.max(0, (immersiveOpacity ?? 50) / 100))
const pillBg = `rgba(0,0,0,${opacity})`
const theme = useTheme()
const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

const pillSx = {
display: 'flex',
alignItems: 'center',
borderRadius: '20px',
bgcolor: pillBg,
border: '1px solid rgba(255,255,255,0.15)',
backdropFilter: 'blur(8px)',
px: 1.5,
height: 36,
gap: 0.5,
}

const [title, setTitle] = useState(() => {
if (viewMode === 'strudel') return getInitialStrudelTitle(DEFAULT_STRUDEL_TITLE)
return getInitialGlslTitle(DEFAULT_GLSL_TITLE)
})

// Sync title when switching tabs
useEffect(() => {
if (viewMode === 'glsl') {
setTitle(editorRef.current?.getTitle() ?? getInitialGlslTitle(DEFAULT_GLSL_TITLE))
} else if (viewMode === 'strudel') {
setTitle(strudelRef.current?.getTitle() ?? getInitialStrudelTitle(DEFAULT_STRUDEL_TITLE))
}
}, [viewMode, editorRef, strudelRef])

const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
const val = e.target.value
setTitle(val)
if (viewMode === 'glsl') {
editorRef.current?.setTitle(val)
} else if (viewMode === 'strudel') {
strudelRef.current?.setTitle(val)
}
}

const handleTabSelect = (mode: ViewMode) => {
if (mode !== viewMode && viewMode === 'strudel') {
strudelRef.current?.closeSounds()
}
setViewMode(mode)
setMobileMenuOpen(false)
}

// Left pill: editable title for glsl/strudel, static label + icon for others
const leftPill = (
<Box sx={{ ...pillSx, width: 300, pointerEvents: 'auto', flexShrink: 0 }}>
{viewMode === 'glsl' || viewMode === 'strudel' ? (
<InputBase
value={title}
onChange={handleTitleChange}
sx={{
color: 'white',
fontFamily: 'monospace',
fontSize: '0.875rem',
flex: 1,
'& input': { p: 0 },
}}
inputProps={{ 'aria-label': viewMode === 'glsl' ? 'Shader title' : 'Pattern title' }}
/>
) : (
<>
<Box sx={{ color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', mr: 0.5, flexShrink: 0 }}>
{LEFT_PILL_ICONS[viewMode]}
</Box>
<Typography
sx={{
color: 'white',
fontFamily: 'monospace',
fontSize: '0.875rem',
flex: 1,
overflow: 'hidden',
textOverflow: 'ellipsis',
whiteSpace: 'nowrap',
}}
>
{TAB_LABELS[viewMode]}
</Typography>
</>
)}
</Box>
)

// Action buttons pill (GLSL or Strudel only)
const actionPill = (viewMode === 'glsl' || viewMode === 'strudel') ? (
<Box sx={{ ...pillSx, px: 1, gap: 0.5, pointerEvents: 'auto' }}>
{viewMode === 'glsl' && (
<>
<Tooltip title="Available uniforms" placement="bottom">
<IconButton size="small" sx={{ color: 'white' }} onClick={() => editorRef.current?.toggleUniforms()} aria-label="Available uniforms">
<InfoOutlinedIcon fontSize="small" />
</IconButton>
</Tooltip>
<Tooltip title="Save" placement="bottom">
<IconButton size="small" sx={{ color: 'white' }} onClick={() => editorRef.current?.save()} aria-label="Save">
<SaveIcon fontSize="small" />
</IconButton>
</Tooltip>
<Tooltip title="Import shader from file" placement="bottom">
<IconButton size="small" sx={{ color: 'white' }} onClick={() => editorRef.current?.triggerImport()} aria-label="Import shader from file">
<FileUploadIcon fontSize="small" />
</IconButton>
</Tooltip>
<Tooltip title="Export shader to file" placement="bottom">
<IconButton size="small" sx={{ color: 'white' }} onClick={() => editorRef.current?.triggerExport()} aria-label="Export shader to file">
<FileDownloadIcon fontSize="small" />
</IconButton>
</Tooltip>
<Tooltip title="Run Shader" placement="bottom">
<IconButton size="small" sx={{ color: 'white' }} onClick={() => editorRef.current?.run()} aria-label="Run Shader">
<PlayArrowIcon fontSize="small" />
</IconButton>
</Tooltip>
</>
)}

{viewMode === 'strudel' && (
<>
<Tooltip title="Available sounds" placement="bottom">
<IconButton size="small" sx={{ color: 'white' }} onClick={() => strudelRef.current?.toggleSounds()} aria-label="Available sounds">
<MusicNoteIcon fontSize="small" />
</IconButton>
</Tooltip>
<Tooltip title="Save" placement="bottom">
<IconButton size="small" sx={{ color: 'white' }} onClick={() => strudelRef.current?.save()} aria-label="Save">
<SaveIcon fontSize="small" />
</IconButton>
</Tooltip>
<Tooltip title="Import pattern from file" placement="bottom">
<IconButton size="small" sx={{ color: 'white' }} onClick={() => strudelRef.current?.triggerImport()} aria-label="Import pattern from file">
<FileUploadIcon fontSize="small" />
</IconButton>
</Tooltip>
<Tooltip title="Export pattern to file" placement="bottom">
<IconButton size="small" sx={{ color: 'white' }} onClick={() => strudelRef.current?.triggerExport()} aria-label="Export pattern to file">
<FileDownloadIcon fontSize="small" />
</IconButton>
</Tooltip>
<Tooltip title="Play Strudel" placement="bottom">
<IconButton size="small" sx={{ color: 'white' }} onClick={() => strudelRef.current?.play()} aria-label="Play Strudel">
<PlayArrowIcon fontSize="small" />
</IconButton>
</Tooltip>
<Tooltip title="Stop Strudel" placement="bottom">
<IconButton size="small" sx={{ color: 'white' }} onClick={() => strudelRef.current?.pause()} aria-label="Stop Strudel">
<StopIcon fontSize="small" />
</IconButton>
</Tooltip>
</>
)}
</Box>
) : null

// Tabs pill: one icon per tab, active highlighted
const tabsPill = (
<Box sx={{ ...pillSx, px: 0.75, gap: 0, pointerEvents: 'auto' }}>
{tabConfigs.map(({ value, label }) => {
const isActive = value === viewMode
return (
<Tooltip key={value} title={label} placement="bottom">
<IconButton
size="small"
onClick={() => handleTabSelect(value)}
sx={{
color: isActive ? 'white' : 'rgba(255,255,255,0.4)',
bgcolor: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
borderRadius: '50%',
'&:hover': {
color: 'white',
bgcolor: 'rgba(255,255,255,0.1)',
},
p: 0.5,
}}
aria-label={label}
aria-pressed={isActive}
>
{TAB_ICONS[value]}
</IconButton>
</Tooltip>
)
})}
</Box>
)

// ── Mobile layout ──────────────────────────────────────────────
if (isMobile) {
return (
<Box
sx={{
position: 'absolute',
top: 0,
right: 0,
display: 'flex',
flexDirection: 'column',
alignItems: 'flex-end',
p: 0.5,
pointerEvents: 'none',
// When menu is open, the overlay covers 100vh
...(mobileMenuOpen && {
left: 0,
height: '100vh',
}),
}}
>
{/* Hamburger / close pill */}
<Box sx={{ ...pillSx, pointerEvents: 'auto', px: 0.75 }}>
<IconButton
size="small"
onClick={() => setMobileMenuOpen(v => !v)}
sx={{ color: 'white', p: 0.5 }}
aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
>
{mobileMenuOpen ? <CloseIcon fontSize="small" /> : <MenuIcon fontSize="small" />}
</IconButton>
</Box>

{/* Expanded menu: pills stacked vertically */}
{mobileMenuOpen && (
<Box
sx={{
display: 'flex',
flexDirection: 'column',
alignItems: 'flex-end',
gap: 1,
mt: 1,
pointerEvents: 'auto',
}}
>
{leftPill}
{actionPill}
{tabsPill}
</Box>
)}
</Box>
)
}

// ── Desktop layout ─────────────────────────────────────────────
return (
<Box
sx={{
display: 'flex',
alignItems: 'center',
justifyContent: 'space-between',
px: 1,
py: 0.5,
flexShrink: 0,
pointerEvents: 'none',
}}
>
{leftPill}

{/* Right side: action buttons pill (when applicable) + tabs pill */}
<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
{actionPill}
{tabsPill}
</Box>
</Box>
)
}
