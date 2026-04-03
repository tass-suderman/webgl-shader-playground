import { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'

interface ExampleMeta {
  id: string
  title: string
}

interface ExampleFile {
  title: string
  content: string
}

interface ExamplesPanelProps {
  type: 'glsl' | 'strudel'
  onLoad: (title: string, content: string) => void
}

export default function ExamplesPanel({ type, onLoad }: ExamplesPanelProps) {
  const [examples, setExamples] = useState<ExampleMeta[]>([])
  const [listError, setListError] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [pending, setPending] = useState<ExampleMeta | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    setListError(false)
    fetch(`./examples/${type}/index.json`)
      .then(r => r.json())
      .then((data: ExampleMeta[]) => setExamples(data))
      .catch(() => setListError(true))
  }, [type])

  const handleSelect = (example: ExampleMeta) => {
    setLoadError(false)
    setPending(example)
    setConfirmOpen(true)
  }

  const handleConfirm = () => {
    if (!pending) return
    setConfirmOpen(false)
    fetch(`./examples/${type}/${pending.id}.json`)
      .then(r => r.json())
      .then((data: ExampleFile) => onLoad(data.title, data.content))
      .catch(() => setLoadError(true))
    setPending(null)
  }

  const handleCancel = () => {
    setConfirmOpen(false)
    setPending(null)
  }

  const itemLabel = type === 'glsl' ? 'shader' : 'pattern'

  return (
    <Box sx={{ height: '100%', overflow: 'auto', bgcolor: '#1e1e1e' }}>
      {listError && (
        <Typography
          variant="caption"
          sx={{ display: 'block', p: 2, color: '#ff8080', fontFamily: 'monospace' }}
        >
          Failed to load examples. Please try again later.
        </Typography>
      )}
      {loadError && (
        <Typography
          variant="caption"
          sx={{ display: 'block', px: 2, pt: 1, color: '#ff8080', fontFamily: 'monospace' }}
        >
          Failed to load example. Please try again.
        </Typography>
      )}
      {!listError && examples.length === 0 && (
        <Typography
          variant="caption"
          sx={{ display: 'block', p: 2, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}
        >
          No examples found.
        </Typography>
      )}
      {!listError && examples.length > 0 && (
        <List dense disablePadding>
          {examples.map(ex => (
            <ListItem key={ex.id} disablePadding>
              <ListItemButton
                onClick={() => handleSelect(ex)}
                sx={{
                  px: 2,
                  py: 1,
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
                }}
              >
                <ListItemText
                  primary={ex.title}
                  primaryTypographyProps={{
                    sx: {
                      color: 'rgba(255,255,255,0.85)',
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

      <Dialog open={confirmOpen} onClose={handleCancel}>
        <DialogTitle>Load example?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Loading <strong>&ldquo;{pending?.title}&rdquo;</strong> will replace your current{' '}
            {itemLabel}. Any unsaved progress will be lost.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel}>Cancel</Button>
          <Button onClick={handleConfirm} variant="contained" color="primary">
            Load
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
