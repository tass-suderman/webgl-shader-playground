import Box from '@mui/material/Box'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import CloseIcon from '@mui/icons-material/Close'
import { SOUND_CATEGORIES } from './soundCategories'

interface SoundsModalProps {
  open: boolean
  onClose: () => void
}

export default function SoundsModal({ open, onClose }: SoundsModalProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { bgcolor: 'var(--pg-bg-panel)', color: 'var(--pg-text-primary)' } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Typography variant="h6" sx={{ fontFamily: 'monospace', fontSize: '1rem' }}>
          Available Sounds
        </Typography>
        <IconButton size="small" onClick={onClose} aria-label="Close sounds dialog" sx={{ color: 'var(--pg-text-primary)' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 0 }}>
        {SOUND_CATEGORIES.map(cat => (
          <Box key={cat.label} sx={{ mb: 2 }}>
            <Typography variant="caption" sx={{ color: 'var(--pg-text-muted)', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {cat.label}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
              {cat.sounds.map(s => (
                <Typography
                  key={s}
                  component="code"
                  sx={{ bgcolor: 'var(--pg-bg-button)', px: 0.75, py: 0.25, borderRadius: 0.5, fontSize: '0.8rem', fontFamily: 'monospace', color: '#9cdcfe' }}
                >
                  {s}
                </Typography>
              ))}
            </Box>
            {cat.aliases && Object.keys(cat.aliases).length > 0 && (
              <Typography variant="caption" sx={{ color: 'var(--pg-text-muted)', fontFamily: 'monospace', display: 'block', mt: 0.5 }}>
                Aliases: {Object.entries(cat.aliases).map(([a, b]) => `${a} → ${b}`).join(', ')}
              </Typography>
            )}
          </Box>
        ))}
        <Typography variant="caption" sx={{ color: 'var(--pg-text-muted)', fontFamily: 'monospace', display: 'block', mt: 1 }}>
          Use with <code style={{ color: '#9cdcfe' }}>.sound("name")</code> in your pattern.
        </Typography>
      </DialogContent>
    </Dialog>
  )
}
