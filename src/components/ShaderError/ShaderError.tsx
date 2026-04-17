import { useEffect, useState } from 'react'
import { Box, IconButton, Typography } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'

interface ShaderErrorProps {
  error: string | null
}

export default function ShaderError({ error }: ShaderErrorProps) {
  const [dismissed, setDismissed] = useState(false)

  // Show the panel again whenever a new (non-null) error arrives
  useEffect(() => {
    if (error) setDismissed(false)
  }, [error])

  if (!error || dismissed) return null

  return (
    <Box
      sx={{
        px: 2,
        py: 1,
        bgcolor: '#5a0000',
        borderBottom: '1px solid #ff0000',
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
          color: '#ff8080',
          '&:hover': { color: '#ffffff' },
        }}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
      <Typography
        variant="caption"
        sx={{ color: '#ff8080', fontFamily: 'monospace', whiteSpace: 'pre-wrap', pr: 3 }}
      >
        {error}
      </Typography>
    </Box>
  )
}
