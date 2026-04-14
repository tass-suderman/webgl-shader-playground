
import { useState } from 'react'
import { Box, Divider, IconButton, List, ListItem, ListItemButton, ListItemText, Tooltip, Typography } from '@mui/material'
import { DeleteOutline, Download } from '@mui/icons-material'
import { zipSync, strToU8 } from 'fflate'
import CombinedExamplesPanel from './CombinedExamplesPanel'
import type { SavedEntry } from '../../hooks/useSavedContent'
import DeleteItemDialog from './DeleteItemDialog'

interface SavedPaneProps {
  savedShaders: SavedEntry[]
  savedPatterns: SavedEntry[]
  onDeleteShader: (title: string) => void
  onDeletePattern: (title: string) => void
  onLoadShader: (title: string, content: string) => void
  onLoadPattern: (title: string, content: string) => void
  onLoadGlslExample: (title: string, content: string) => void
  onLoadStrudelExample: (title: string, content: string) => void
}

interface PendingDelete {
  title: string
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

function SavedSection({
  heading,
  entries,
  ext,
  onLoad,
  onDelete,
}: {
  heading: string
  entries: SavedEntry[]
  ext: string
  onLoad: (title: string, content: string) => void
  onDelete: (title: string) => void
}) {
  if (entries.length === 0) return null
  return (
    <Box sx={{ mb: 2 }}>
      <Typography
        variant="subtitle2"
        sx={{
          px: 2,
          py: 1,
          color: 'textColor.muted',
          fontFamily: 'monospace',
          fontSize: '0.7rem',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          borderBottom: '1px solid',
					borderColor: 'border.faint',
        }}
      >
        {heading}
      </Typography>
      <List dense disablePadding>
        {entries.map(entry => (
          <ListItem
            key={entry.title}
            disablePadding
            secondaryAction={
              <Tooltip title={`Delete ${ext === 'glsl' ? 'shader' : 'pattern'}`}>
                <IconButton
                  size="small"
                  edge="end"
                  aria-label={`Delete ${entry.title}`}
                  onClick={() => onDelete(entry.title)}
                  sx={{ color: 'textColor.muted', '&:hover': { color: '#ff8080' } }}
                >
                  <DeleteOutline fontSize="small" />
                </IconButton>
              </Tooltip>
            }
          >
            <ListItemButton
              onClick={() => onLoad(entry.title, entry.content)}
              sx={{
                px: 2,
                py: 0.75,
                pr: 6,
                '&:hover': { bgcolor: 'background.button' },
              }}
            >
              <ListItemText
                primary={entry.title}
                primaryTypographyProps={{
                  sx: {
                    color: 'textColor.primary',
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                  },
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  )
}

export default function SavedPane({
  savedShaders,
  savedPatterns,
  onDeleteShader,
  onDeletePattern,
  onLoadShader,
  onLoadPattern,
  onLoadGlslExample,
  onLoadStrudelExample,
}: SavedPaneProps) {
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const hasSavedContent = savedShaders.length > 0 || savedPatterns.length > 0

  const handleDeleteRequest = (title: string, type: 'shader' | 'pattern') => {
    setPendingDelete({ title, type })
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (!pendingDelete) return
    if (pendingDelete.type === 'shader') {
      onDeleteShader(pendingDelete.title)
    } else {
      onDeletePattern(pendingDelete.title)
    }
    setDeleteDialogOpen(false)
    setPendingDelete(null)
  }

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
    setPendingDelete(null)
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
      {/* Header */}
      <Box
        sx={{
          px: 2,
          py: 1,
          bgcolor: 'background.header',
          borderBottom: '1px solid',
					borderColor: 'border.subtle',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="subtitle2" sx={{ fontFamily: 'monospace' }}>
          Saved
        </Typography>
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
                bgcolor: 'background.header',
                borderBottom: '1px solid',
								borderColor: 'border.faint',
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                }}
              >
                Saved Content
              </Typography>
            </Box>

            <SavedSection
              heading="Shaders"
              entries={savedShaders}
              ext="glsl"
              onLoad={onLoadShader}
              onDelete={(title) => handleDeleteRequest(title, 'shader')}
            />
            <SavedSection
              heading="Patterns"
              entries={savedPatterns}
              ext="strudel"
              onLoad={onLoadPattern}
              onDelete={(title) => handleDeleteRequest(title, 'pattern')}
            />

            <Divider sx={{ borderColor: 'border.faint', my: 1 }} />
          </>
        )}

        {/* ── Examples section ── */}
        <Box
          sx={{
            px: 2,
            py: 0.75,
            bgcolor: 'background.header',
            borderBottom: 'border.faint',
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              fontWeight: 700,
            }}
          >
            Examples
          </Typography>
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
    </Box>
  )
}
