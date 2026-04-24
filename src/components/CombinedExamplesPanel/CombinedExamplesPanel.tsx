import { useState, useEffect } from 'react'
import {
  Box,
  CircularProgress,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography
}	from '@mui/material'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import LoadExampleDialog from '../LoadExampleDialog/LoadExampleDialog'
import { useAppStorage } from '../../hooks/useAppStorage'

interface ExampleMeta {
  id: string
  title: string
  aiGenerated?: boolean
}

type ExampleType = 'glsl' | 'strudel'

interface PendingExample {
  meta: ExampleMeta
  type: ExampleType
}

interface CombinedExamplesPanelProps {
  onLoadGlsl: (title: string, content: string) => void
  onLoadStrudel: (title: string, content: string) => void
  /** When true, renders without an outer scroll container (for embedding inside another scrollable pane) */
  embedded?: boolean
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
          color: 'textColor.muted',
          fontFamily: 'monospace',
          fontSize: '0.7rem',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}
      >
        {heading}
      </Typography>

      {loading && (
        <Box sx={{ px: 2, py: 1 }}>
          <CircularProgress size={16} sx={{ color: 'textColor.muted'}} />
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
          sx={{ display: 'block', px: 2, py: 1, color: 'textColor.muted', fontFamily: 'monospace' }}
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
                  '&:hover': { bgcolor: 'background.button' },
                }}
              >
                <ListItemText
                  primary={ex.title}
                  slotProps={{
                    primary:{
                      sx: {
                        color: 'textColor.primary',
                        fontFamily: 'monospace',
                        fontSize: '0.875rem',
                      },
                    }
                  }}
                />
                {ex.aiGenerated && (
                  <AutoAwesomeIcon titleAccess="AI-generated example" sx={{ fontSize: '0.875rem', color: 'rgba(255,220,100,0.8)', ml: 1 }} />
                )}
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  )
}

export default function CombinedExamplesPanel({ onLoadGlsl, onLoadStrudel, embedded = false }: CombinedExamplesPanelProps) {
  const [pending, setPending] = useState<PendingExample | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [dontShowAgain, setDontShowAgain] = useState(false)

  const { warnOnLoadExample, setWarnOnLoadExample } = useAppStorage()

  const loadExample = (meta: ExampleMeta, type: ExampleType) => {
    setLoadError(false)
    const ext = type === 'glsl' ? 'glsl' : 'strudel'
    fetch(`./examples/${type}/${meta.id}.${ext}`)
      .then(r => r.text())
      .then((content: string) => {
        if (type === 'glsl') onLoadGlsl(meta.title, content)
        else onLoadStrudel(meta.title, content)
      })
      .catch(() => setLoadError(true))
  }

  const handleSelect = (meta: ExampleMeta, type: ExampleType) => {
    if (!warnOnLoadExample) {
      loadExample(meta, type)
      return
    }
    setLoadError(false)
    setDontShowAgain(false)
    setPending({ meta, type })
    setConfirmOpen(true)
  }

  const handleConfirm = () => {
    if (!pending) return
    setConfirmOpen(false)
    if (dontShowAgain) {
      setWarnOnLoadExample(false)
    }
    loadExample(pending.meta, pending.type)
    setPending(null)
  }

  const handleCancel = () => {
    setConfirmOpen(false)
    setPending(null)
  }

  const itemLabel = pending?.type === 'glsl' ? 'shader' : 'pattern'

  return (
    <Box
      sx={embedded ? {} : {
        height: '100%',
        overflow: 'auto',
        bgcolor: 'background.panel',
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

      <LoadExampleDialog confirmOpen={confirmOpen} title={pending?.meta.title ?? ""} itemLabel={itemLabel} onConfirm={handleConfirm} onCancel={handleCancel} dontShowAgain={dontShowAgain} setDontShowAgain={setDontShowAgain} />
    </Box>
  )
}
