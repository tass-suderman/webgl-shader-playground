import { useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import CloseIcon from '@mui/icons-material/Close'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import DownloadIcon from '@mui/icons-material/Download'
import { zipSync, strToU8 } from 'fflate'
import CombinedExamplesPanel from './CombinedExamplesPanel'
import type { SavedEntry } from '../../hooks/useSavedContent'

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
          color: 'var(--pg-text-muted)',
          fontFamily: 'monospace',
          fontSize: '0.7rem',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          borderBottom: '1px solid var(--pg-border-faint)',
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
                  sx={{ color: 'var(--pg-text-muted)', '&:hover': { color: '#ff8080' } }}
                >
                  <DeleteOutlineIcon fontSize="small" />
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
                '&:hover': { bgcolor: 'var(--pg-bg-button)' },
              }}
            >
              <ListItemText
                primary={entry.title}
                primaryTypographyProps={{
                  sx: {
                    color: 'var(--pg-text-primary)',
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
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'var(--pg-bg-panel)' }}>
      {/* Header */}
      <Box
        sx={{
          px: 2,
          py: 1,
          bgcolor: 'var(--pg-bg-header)',
          borderBottom: '1px solid var(--pg-border-subtle)',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="subtitle2" sx={{ color: 'var(--pg-text-primary)', fontFamily: 'monospace' }}>
          Saved
        </Typography>
        {hasSavedContent && (
          <Tooltip title="Export all saved content as zip">
            <IconButton
              size="small"
              onClick={handleExportAll}
              aria-label="Export all saved content"
              sx={{ color: 'var(--pg-text-primary)' }}
            >
              <DownloadIcon fontSize="small" />
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
                bgcolor: 'var(--pg-bg-header)',
                borderBottom: '1px solid var(--pg-border-faint)',
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  color: 'var(--pg-text-primary)',
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

            <Divider sx={{ borderColor: 'var(--pg-border-faint)', my: 1 }} />
          </>
        )}

        {/* ── Examples section ── */}
        <Box
          sx={{
            px: 2,
            py: 0.75,
            bgcolor: 'var(--pg-bg-header)',
            borderBottom: '1px solid var(--pg-border-faint)',
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{
              color: 'var(--pg-text-primary)',
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

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'var(--pg-bg-header)',
            color: 'var(--pg-text-primary)',
            border: '1px solid var(--pg-border-default)',
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Typography variant="h6" sx={{ fontFamily: 'monospace', fontSize: '1rem', color: 'var(--pg-text-primary)' }}>
            Delete entry?
          </Typography>
          <IconButton size="small" onClick={handleDeleteCancel} aria-label="Close dialog" sx={{ color: 'var(--pg-text-muted)' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 0 }}>
          <Typography variant="body2" sx={{ color: 'var(--pg-text-muted)', fontFamily: 'monospace' }}>
            Delete <strong style={{ color: 'var(--pg-accent)' }}>{pendingDelete?.title}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 2 }}>
          <Button
            onClick={handleDeleteCancel}
            size="small"
            sx={{ textTransform: 'none', color: 'var(--pg-text-muted)' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            size="small"
            sx={{ textTransform: 'none' }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
