import { useEffect, useMemo, useState } from 'react'
import {
  Box,
  IconButton,
  Tooltip,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { type ViewMode, tabConfigs } from '../../utility/tabConfigs'
import { type EditorPaneHandle } from '../EditorPane/EditorPane'
import { type StrudelPaneHandle } from '../StrudelPane/StrudelPane'
import { getInitialGlslTitle, getInitialStrudelTitle, useAppStorage } from '../../hooks/useAppStorage'
import TitlePill from './TitlePill'
import { DEFAULT_STRUDEL_TITLE } from '../../utility/strudel/defaults'
import { DEFAULT_SHADER_TITLE } from '../../utility/shader/defaults'
import TabsPill from './TabsPill'
import MobileMenuIconPill from './MobileMenuIconPill'
import { FileDownload, FileUpload, InfoOutlined, MusicNote, PlayArrow, Save, Stop } from '@mui/icons-material';
import SavedActionsPill from './SavedActionsPill'

interface ImmersiveTopBarProps {
	viewMode: ViewMode
	setViewMode: (mode: ViewMode) => void
	strudelRef: React.RefObject<StrudelPaneHandle>
	editorRef: React.RefObject<EditorPaneHandle>
}

interface PillActionButton {
	title: string
	ariaLabel: string
	onClick: () => void
	icon: React.ReactNode
	disabled?: boolean
}

const mapActionsToButtons = (actions: PillActionButton[]) => {
  return actions.map(({ title, ariaLabel, onClick, icon, disabled = false }, index) => (
    <Tooltip key={index} title={title} placement="bottom">
      <IconButton
        size="small"
        onClick={onClick}
        sx={{ color: 'textColor.primary' }}
        aria-label={ariaLabel}
        disabled={disabled}
      >
        {icon}
      </IconButton>
    </Tooltip>
  ))
}

export const ImmersiveTopBar = ({
  viewMode,
  setViewMode,
  strudelRef,
  editorRef,
}: ImmersiveTopBarProps) => {
  const { immersiveOpacity } = useAppStorage()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const shaderActions: PillActionButton[] = useMemo(() => [
    {
      title: 'Available uniforms',
      ariaLabel: 'Available uniforms',
      onClick: () => editorRef.current?.toggleUniforms(),
      icon: <InfoOutlined fontSize="small" />
    },
    {
      title: 'Save',
      ariaLabel: 'Save',
      onClick: () => editorRef.current?.save(),
      icon: <Save fontSize="small" />
    },
    {
      title: 'Import shader from file',
      ariaLabel: 'Import shader from file',
      onClick: () => editorRef.current?.triggerImport(),
      icon: <FileUpload fontSize="small" />
    },
    {
      title: 'Export shader to file',
      ariaLabel: 'Export shader to file',
      onClick: () => editorRef.current?.triggerExport(),
      icon: <FileDownload fontSize="small" />
    },
    {
      title: 'Run Shader',
      ariaLabel: 'Run Shader',
      onClick: () => editorRef.current?.run(),
      icon: <PlayArrow fontSize="small" />
    },
  ], [editorRef])

  const strudelActions: PillActionButton[] = useMemo(() => [
    {
      title: 'Available sounds',
      ariaLabel: 'Available sounds',
      onClick: () => strudelRef.current?.toggleSounds(),
      icon: <MusicNote fontSize="small" />
    },
    {
      title: 'Save',
      ariaLabel: 'Save',
      onClick: () => strudelRef.current?.save(),
      icon: <Save fontSize="small" />
    },
    {
      title: 'Import pattern from file',
      ariaLabel: 'Import pattern from file',
      onClick: () => strudelRef.current?.triggerImport(),
      icon: <FileUpload fontSize="small" />
    },
    {
      title: 'Export pattern to file',
      ariaLabel: 'Export pattern to file',
      onClick: () => strudelRef.current?.triggerExport(),
      icon: <FileDownload fontSize="small" />
    },
    {
      title: 'Play Strudel',
      ariaLabel: 'Play Strudel',
      onClick: () => strudelRef.current?.play(),
      icon: <PlayArrow fontSize="small" />
    },
    {
      title: 'Stop Strudel',
      ariaLabel: 'Stop Strudel',
      onClick: () => strudelRef.current?.pause(),
      icon: <Stop fontSize="small" />,
    },
  ], [strudelRef])

  const pillSx = useMemo(() => {
    const opacity = Math.min(1, Math.max(0, (immersiveOpacity ?? 50) / 100))
	  return {
      display: 'flex',
      alignItems: 'center',
      borderRadius: '20px',
      bgcolor: `rgba(0,0,0,${opacity})`,
      border: '1px solid rgba(255,255,255,0.15)',
      backdropFilter: 'blur(8px)',
      px: 1.5,
      height: 36,
      gap: 0.5,
    }
  }, [immersiveOpacity]);

  const [title, setTitle] = useState(() => {
    if (viewMode === 'strudel') return getInitialStrudelTitle(DEFAULT_STRUDEL_TITLE)
    return getInitialGlslTitle(DEFAULT_SHADER_TITLE)
  })

  // Sync title when switching tabs
  useEffect(() => {
    if (viewMode === 'glsl') {
      setTitle(editorRef.current?.getTitle() ?? getInitialGlslTitle(DEFAULT_SHADER_TITLE))
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
  }

  const leftPill = (
    <TitlePill
      title={title}
      onTitleChange={handleTitleChange}
      tabConfig={tabConfigs.find(c => c.value === viewMode)!}
      sx={ pillSx }
    />
  )

  // Action buttons pill (GLSL or Strudel only)
  const actionPill = useMemo(() =>
  {
    let innerContent: React.ReactNode = null
    switch (viewMode) {
    case 'glsl': 
      innerContent = mapActionsToButtons(shaderActions);
      break;
    case 'strudel': 
      innerContent = mapActionsToButtons(strudelActions);
      break;
    case 'saved': 
      innerContent = <SavedActionsPill />
      break;
    }
    return innerContent ? (
      <Box sx={{ ...pillSx, px: 1, gap: 0.5, pointerEvents: 'auto' }}>
        {innerContent}
      </Box>
    ) : null
  }, [viewMode, editorRef, strudelRef, immersiveOpacity])

  const tabsPill = (
    <TabsPill
      viewMode={viewMode}
      handleTabSelect={handleTabSelect}
      sx={pillSx}
    />
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
        }}
      >
        {/* Hamburger / close pill */}
        <MobileMenuIconPill
          sx={pillSx}
          open={mobileMenuOpen}
          setOpen={() => setMobileMenuOpen(open => !open)}
        />

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
            {tabsPill}
            {actionPill}
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
