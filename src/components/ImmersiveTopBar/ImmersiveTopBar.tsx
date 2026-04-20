import { useEffect, useRef, useState } from 'react'
import {
  Box,
  IconButton,
  InputBase,
  ListItemIcon,
  ListItemText,
  MenuItem,
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
import { type ViewMode, tabConfigs } from '../../constants/tabConfigs'
import { type EditorPaneHandle } from '../EditorPane/EditorPane'
import { type StrudelPaneHandle } from '../StrudelPane/StrudelPane'
import { getInitialGlslTitle, getInitialStrudelTitle, useAppStorage } from '../../hooks/useAppStorage'

const DEFAULT_GLSL_TITLE = 'Fragment Shader (GLSL)'
const DEFAULT_STRUDEL_TITLE = 'Strudel Pattern'

const TAB_ICONS: Record<ViewMode, React.ReactElement> = {
  glsl: <TabIcon fontSize="small" />,
  strudel: <TabIcon fontSize="small" />,
  saved: <FolderIcon fontSize="small" />,
  settings: <SettingsIcon fontSize="small" />,
  about: <InfoIcon fontSize="small" />,
}

const TAB_ITEM_ICONS: Record<ViewMode, React.ReactElement> = {
  glsl: <TabIcon fontSize="small" />,
  strudel: <MusicNoteIcon fontSize="small" />,
  saved: <FolderIcon fontSize="small" />,
  settings: <SettingsIcon fontSize="small" />,
  about: <InfoIcon fontSize="small" />,
}

const TAB_TEXT_COLOR: Record<string, string> = {
  editor: 'textColor.button',
  utility: 'textColor.utilTab',
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

  const [tabMenuOpen, setTabMenuOpen] = useState(false)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Clean up pending close timer on unmount
  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    }
  }, [])

  const handleMenuMouseEnter = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
    setTabMenuOpen(true)
  }

  const handleMenuMouseLeave = () => {
    closeTimerRef.current = setTimeout(() => setTabMenuOpen(false), 150)
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
    setTabMenuOpen(false)
  }

  const showTitlePill = viewMode === 'glsl' || viewMode === 'strudel'

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
      {/* Left pill: editable title */}
      {showTitlePill ? (
        <Box sx={{ ...pillSx, width: 300, pointerEvents: 'auto' }}>
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
        </Box>
      ) : (
        <Box />
      )}

      {/* Right pill: tab switcher + action buttons */}
      <Box sx={{ ...pillSx, pointerEvents: 'auto', position: 'relative' }}>
        {/* Tab switcher – hover over button or dropdown to keep it open */}
        <Box
          onMouseEnter={handleMenuMouseEnter}
          onMouseLeave={handleMenuMouseLeave}
          sx={{ position: 'relative' }}
        >
          <IconButton size="small" sx={{ color: 'white' }}>
            {TAB_ICONS[viewMode]}
          </IconButton>

          {tabMenuOpen && (
            <Box
              sx={{
                position: 'absolute',
                top: '100%',
                right: 0,
                mt: 0.5,
                bgcolor: pillBg,
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 1,
                backdropFilter: 'blur(8px)',
                overflow: 'hidden',
                minWidth: 160,
                zIndex: 100,
                py: 0.5,
              }}
            >
              {tabConfigs.map(({ value, label, variant }) => (
                <MenuItem
                  key={value}
                  selected={value === viewMode}
                  onClick={() => handleTabSelect(value)}
                  sx={{
                    color: TAB_TEXT_COLOR[variant] ?? 'white',
                    py: 0.75,
                    px: 1.5,
                    '&.Mui-selected': { bgcolor: 'rgba(255,255,255,0.12)' },
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                    fontSize: '0.875rem',
                  }}
                >
                  <ListItemIcon sx={{ color: TAB_TEXT_COLOR[variant] ?? 'white', minWidth: 28 }}>
                    {TAB_ITEM_ICONS[value]}
                  </ListItemIcon>
                  <ListItemText
                    primary={label}
                    sx={{ '& .MuiListItemText-primary': { fontSize: '0.875rem', color: 'inherit' } }}
                  />
                </MenuItem>
              ))}
            </Box>
          )}
        </Box>

        {/* GLSL action buttons */}
        {viewMode === 'glsl' && (
          <>
            <IconButton
              size="small"
              sx={{ color: 'white' }}
              onClick={() => editorRef.current?.toggleUniforms()}
              aria-label="Available uniforms"
            >
              <InfoOutlinedIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              sx={{ color: 'white' }}
              onClick={() => editorRef.current?.save()}
              aria-label="Save"
            >
              <SaveIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              sx={{ color: 'white' }}
              onClick={() => editorRef.current?.triggerImport()}
              aria-label="Import shader from file"
            >
              <FileUploadIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              sx={{ color: 'white' }}
              onClick={() => editorRef.current?.triggerExport()}
              aria-label="Export shader to file"
            >
              <FileDownloadIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              sx={{ color: 'white' }}
              onClick={() => editorRef.current?.run()}
              aria-label="Run Shader"
            >
              <PlayArrowIcon fontSize="small" />
            </IconButton>
          </>
        )}

        {/* Strudel action buttons */}
        {viewMode === 'strudel' && (
          <>
            <IconButton
              size="small"
              sx={{ color: 'white' }}
              onClick={() => strudelRef.current?.toggleSounds()}
              aria-label="Available sounds"
            >
              <MusicNoteIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              sx={{ color: 'white' }}
              onClick={() => strudelRef.current?.save()}
              aria-label="Save"
            >
              <SaveIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              sx={{ color: 'white' }}
              onClick={() => strudelRef.current?.triggerImport()}
              aria-label="Import pattern from file"
            >
              <FileUploadIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              sx={{ color: 'white' }}
              onClick={() => strudelRef.current?.triggerExport()}
              aria-label="Export pattern to file"
            >
              <FileDownloadIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              sx={{ color: 'white' }}
              onClick={() => strudelRef.current?.play()}
              aria-label="Play Strudel"
            >
              <PlayArrowIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              sx={{ color: 'white' }}
              onClick={() => strudelRef.current?.pause()}
              aria-label="Stop Strudel"
            >
              <StopIcon fontSize="small" />
            </IconButton>
          </>
        )}
      </Box>
    </Box>
  )
}
