import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { SOUND_CATEGORIES } from './soundCategories'

/** Inline sounds reference panel – shown in-pane instead of a modal. */
export default function SoundsPanel() {
  return (
    <Box
      sx={{
        flex: 1,
        overflow: 'auto',
        p: 2,
        bgcolor: 'var(--pg-bg-panel)',
        color: 'var(--pg-text-primary)',
      }}
    >
      {SOUND_CATEGORIES.map(cat => (
        <Box key={cat.label} sx={{ mb: 2 }}>
          <Typography
            variant="caption"
            sx={{
              color: 'var(--pg-text-muted)',
              fontFamily: 'monospace',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            {cat.label}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
            {cat.sounds.map(s => (
              <Typography
                key={s}
                component="code"
                sx={{
                  bgcolor: 'var(--pg-bg-button)',
                  px: 0.75,
                  py: 0.25,
                  borderRadius: 0.5,
                  fontSize: '0.8rem',
                  fontFamily: 'monospace',
                  color: '#9cdcfe',
                }}
              >
                {s}
              </Typography>
            ))}
          </Box>
          {cat.aliases && Object.keys(cat.aliases).length > 0 && (
            <Typography
              variant="caption"
              sx={{
                color: 'var(--pg-text-muted)',
                fontFamily: 'monospace',
                display: 'block',
                mt: 0.5,
              }}
            >
              Aliases: {Object.entries(cat.aliases).map(([a, b]) => `${a} → ${b}`).join(', ')}
            </Typography>
          )}
        </Box>
      ))}
      <Typography
        variant="caption"
        sx={{ color: 'var(--pg-text-muted)', fontFamily: 'monospace', display: 'block', mt: 1 }}
      >
        Use with <code style={{ color: '#9cdcfe' }}>.sound("name")</code> in your pattern.
      </Typography>
    </Box>
  )
}
