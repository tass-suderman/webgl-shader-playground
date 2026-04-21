import { useState } from 'react'
import { Box, IconButton, Tooltip, Typography } from '@mui/material'
import { Download } from '@mui/icons-material'
import { zipSync, strToU8 } from 'fflate'
import CombinedExamplesPanel from '../CombinedExamplesPanel/CombinedExamplesPanel'
import { useSavedContent } from '../../hooks/useSavedContent'
import DeleteItemDialog from '../DeleteItemDialog/DeleteItemDialog'
import ConfirmationDialog from '../ConfirmationDialog/ConfirmationDialog'
import SavedSection from './SavedSection'
import SettingsDivider from '../SettingsDivider/SettingsDivider'
import { useAppStorage } from '../../hooks/useAppStorage'

interface SavedPaneProps {
  onLoadShader: (title: string, content: string) => void
  onLoadPattern: (title: string, content: string) => void
  onLoadGlslExample: (title: string, content: string) => void
  onLoadStrudelExample: (title: string, content: string) => void
}

interface PendingDelete {
  title: string
  type: 'shader' | 'pattern'
}

interface PendingLoad {
  title: string
  content: string
  type: 'shader' | 'pattern'
}

function sanitizeFilename(title: string, fallback: string): string {
  return (
    title
      .replace(/[^\w\s.-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^[_\s]+|[_\s]+$/g, '')
      .trim() || fallback
  )
}

export default function SavedPane({
  onLoadShader,
  onLoadPattern,
  onLoadGlslExample,
  onLoadStrudelExample,
}: SavedPaneProps) {
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [pendingLoad, setPendingLoad] = useState<PendingLoad | null>(null)
  const [loadDialogOpen, setLoadDialogOpen] = useState(false)
  const [dontShowAgain, setDontShowAgain] = useState(false)

  const { warnOnLoadSaved, setWarnOnLoadSaved } = useAppStorage()

	const { 
		savedShaders, deleteShader,
		savedPatterns, deletePattern 
	}= useSavedContent();

  const hasSavedContent = savedShaders.length > 0 || savedPatterns.length > 0

  const handleDeleteRequest = (title: string, type: 'shader' | 'pattern') => {
    setPendingDelete({ title, type })
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (!pendingDelete) return
    if (pendingDelete.type === 'shader') {
      deleteShader(pendingDelete.title)
    } else {
      deletePattern(pendingDelete.title)
    }
    setDeleteDialogOpen(false)
    setPendingDelete(null)
  }

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
    setPendingDelete(null)
  }

  const handleLoadRequest = (title: string, content: string, type: 'shader' | 'pattern') => {
    if (!warnOnLoadSaved) {
      if (type === 'shader') onLoadShader(title, content)
      else onLoadPattern(title, content)
      return
    }
    setDontShowAgain(false)
    setPendingLoad({ title, content, type })
    setLoadDialogOpen(true)
  }

  const handleLoadConfirm = () => {
    if (!pendingLoad) return
    if (dontShowAgain) {
      setWarnOnLoadSaved(false)
    }
    if (pendingLoad.type === 'shader') {
      onLoadShader(pendingLoad.title, pendingLoad.content)
    } else {
      onLoadPattern(pendingLoad.title, pendingLoad.content)
    }
    setLoadDialogOpen(false)
    setPendingLoad(null)
  }

  const handleLoadCancel = () => {
    setLoadDialogOpen(false)
    setPendingLoad(null)
  }

  const handleExportAll = () => {
    const files: Record<string, Uint8Array> = {}
    for (const shader of savedShaders) {
      const safeName = sanitizeFilename(shader.title, 'shader')
      files[`shaders/${safeName}.glsl`] = strToU8(shader.content)
    }
    for (const pattern of savedPatterns) {
      const safeName = sanitizeFilename(pattern.title, 'pattern')
      files[`patterns/${safeName}.strudel`] = strToU8(pattern.content)
    }
    const zipped = zipSync(files)
    const blob = new Blob([zipped], { type: 'application/zip' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'saved-content.zip'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.panel' }}>
      {/* Pill gap + optional export button */}
      <Box sx={{ pt: '44px', display: 'flex', justifyContent: 'flex-end', px: 1, flexShrink: 0 }}>
        {hasSavedContent && (
          <Tooltip title="Export all saved content as zip">
            <IconButton
              size="small"
              onClick={handleExportAll}
              aria-label="Export all saved content"
              sx={{ color: 'textColor.primary' }}
            >
              <Download fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Scrollable content */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {/* ── Saved Content section ── */}
        {hasSavedContent && (
          <>
            <Box
              sx={{
                px: 2,
                py: 0.75,
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  fontWeight: 700,
									color: 'textColor.primary',
                }}
								children="Saved Content"
              />
            </Box>
            <SavedSection
              heading="Shaders"
              entries={savedShaders}
              ext="glsl"
              onLoad={(title, content) => handleLoadRequest(title, content, 'shader')}
              onDelete={(title) => handleDeleteRequest(title, 'shader')}
            />
            <SavedSection
              heading="Patterns"
              entries={savedPatterns}
              ext="strudel"
              onLoad={(title, content) => handleLoadRequest(title, content, 'pattern')}
              onDelete={(title) => handleDeleteRequest(title, 'pattern')}
            />

						<SettingsDivider />
          </>
        )}

        {/* ── Examples section ── */}
        <Box
          sx={{
            px: 2,
            py: 0.75,
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              fontWeight: 700,
							color: 'textColor.primary',
            }}
						children="Examples"
          />
        </Box>
        <CombinedExamplesPanel
          embedded
          onLoadGlsl={onLoadGlslExample}
          onLoadStrudel={onLoadStrudelExample}
        />
      </Box>
			<DeleteItemDialog
				open={deleteDialogOpen}
				title={pendingDelete?.type || 'shader'}
				onConfirm={handleDeleteConfirm}
				onCancel={handleDeleteCancel}
			/>
			<ConfirmationDialog
				open={loadDialogOpen}
				heading="Load saved content?"
				body={<>Loading <strong style={{ color: 'accent' }}>{pendingLoad?.title}</strong> will replace your current {pendingLoad?.type === 'shader' ? 'shader' : 'pattern'}. Any unsaved progress will be lost.</>}
				confirmLabel="Load"
				onCancel={handleLoadCancel}
				onConfirm={handleLoadConfirm}
				dontShowAgain={dontShowAgain}
				setDontShowAgain={setDontShowAgain}
			/>
    </Box>
  )
}
