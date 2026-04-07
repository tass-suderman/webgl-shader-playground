import { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'
import CloseIcon from '@mui/icons-material/Close'

interface ExampleMeta {
  id: string
  title: string
}

interface ExampleFile {
  title: string
  content: string
}

type ExampleType = 'glsl' | 'strudel'

interface PendingExample {
  meta: ExampleMeta
  type: ExampleType
}

interface CombinedExamplesPanelProps {
  onLoadGlsl: (title: string, content: string) => void
  onLoadStrudel: (title: string, content: string) => void
}

function ExampleSection({
  heading,
  type,
  onSelect,
}: {
  heading: string
  type: ExampleType
  onSelect: (meta: ExampleMeta, type: ExampleType) => void
}) {
  const [examples, setExamples] = useState<ExampleMeta[]>([])
  const [listError, setListError] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setListError(false)
    setLoading(true)
    fetch(`./examples/${type}/index.json`)
      .then(r => r.json())
      .then((data: ExampleMeta[]) => { setExamples(data); setLoading(false) })
      .catch(() => { setListError(true); setLoading(false) })
  }, [type])

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

      {loading && (
        <Box sx={{ px: 2, py: 1 }}>
          <CircularProgress size={16} sx={{ color: 'var(--pg-text-muted)' }} />
        </Box>
      )}
      {listError && (
        <Typography
          variant="caption"
          sx={{ display: 'block', px: 2, py: 1, color: '#ff8080', fontFamily: 'monospace' }}
        >
          Failed to load examples.
        </Typography>
      )}
      {!loading && !listError && examples.length === 0 && (
        <Typography
          variant="caption"
          sx={{ display: 'block', px: 2, py: 1, color: 'var(--pg-text-muted)', fontFamily: 'monospace' }}
        >
          No examples found.
        </Typography>
      )}
      {!loading && !listError && examples.length > 0 && (
        <List dense disablePadding>
          {examples.map(ex => (
            <ListItem key={ex.id} disablePadding>
              <ListItemButton
                onClick={() => onSelect(ex, type)}
                sx={{
                  px: 2,
                  py: 0.75,
                  '&:hover': { bgcolor: 'var(--pg-bg-button)' },
                }}
              >
                <ListItemText
                  primary={ex.title}
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
      )}
    </Box>
  )
}

export default function CombinedExamplesPanel({ onLoadGlsl, onLoadStrudel }: CombinedExamplesPanelProps) {
  const [pending, setPending] = useState<PendingExample | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [loadError, setLoadError] = useState(false)

  const handleSelect = (meta: ExampleMeta, type: ExampleType) => {
    setLoadError(false)
    setPending({ meta, type })
    setConfirmOpen(true)
  }

  const handleConfirm = () => {
    if (!pending) return
    setConfirmOpen(false)
    const { meta, type } = pending
    fetch(`./examples/${type}/${meta.id}.json`)
      .then(r => r.json())
      .then((data: ExampleFile) => {
        if (type === 'glsl') onLoadGlsl(data.title, data.content)
        else onLoadStrudel(data.title, data.content)
      })
      .catch(() => setLoadError(true))
    setPending(null)
  }

  const handleCancel = () => {
    setConfirmOpen(false)
    setPending(null)
  }

  const itemLabel = pending?.type === 'glsl' ? 'shader' : 'pattern'

  return (
    <Box
      sx={{
        height: '100%',
        overflow: 'auto',
        bgcolor: 'var(--pg-bg-panel)',
      }}
    >
      {loadError && (
        <Typography
          variant="caption"
          sx={{ display: 'block', px: 2, pt: 1, color: '#ff8080', fontFamily: 'monospace' }}
        >
          Failed to load example. Please try again.
        </Typography>
      )}

      <ExampleSection heading="Shaders" type="glsl" onSelect={handleSelect} />
      <ExampleSection heading="Patterns" type="strudel" onSelect={handleSelect} />

      <Dialog
        open={confirmOpen}
        onClose={handleCancel}
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
            Load example?
          </Typography>
          <IconButton size="small" onClick={handleCancel} aria-label="Close dialog" sx={{ color: 'var(--pg-text-muted)' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 0 }}>
          <Typography variant="body2" sx={{ color: 'var(--pg-text-muted)', fontFamily: 'monospace' }}>
            Loading <strong style={{ color: 'var(--pg-accent)' }}>{pending?.meta.title}</strong> will replace
            your current {itemLabel}. Any unsaved progress will be lost.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 2 }}>
          <Button
            onClick={handleCancel}
            size="small"
            sx={{ textTransform: 'none', color: 'var(--pg-text-muted)' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            variant="contained"
            color="primary"
            size="small"
            sx={{ textTransform: 'none' }}
          >
            Load
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
