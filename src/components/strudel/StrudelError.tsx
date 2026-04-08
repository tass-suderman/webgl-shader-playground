import { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import CloseIcon from '@mui/icons-material/Close'

interface StrudelErrorProps {
  error: string | null
}

export default function StrudelError({ error }: StrudelErrorProps) {
  const [dismissed, setDismissed] = useState(false)

  // Re-show the panel whenever a new (non-null) error arrives
  useEffect(() => {
    if (error) setDismissed(false)
  }, [error])

  if (!error || dismissed) return null

  return (
    <Box
      sx={{
        px: 2,
        py: 1,
        bgcolor: '#3a1a00',
        borderBottom: '1px solid #ff8c00',
        flexShrink: 0,
        position: 'relative',
      }}
    >
      <IconButton
        aria-label="Dismiss error"
        onClick={() => setDismissed(true)}
        size="small"
        sx={{
          position: 'absolute',
          top: 4,
          right: 4,
          color: '#ffb347',
          '&:hover': { color: '#ffffff' },
        }}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
      <Typography
        variant="caption"
        sx={{ color: '#ffb347', fontFamily: 'monospace', whiteSpace: 'pre-wrap', pr: 3 }}
      >
        {error}
      </Typography>
    </Box>
  )
}
