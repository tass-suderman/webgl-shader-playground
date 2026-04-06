import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

interface ShaderErrorProps {
  error: string | null
}

export default function ShaderError({ error }: ShaderErrorProps) {
  if (!error) return null

  return (
    <Box
      sx={{
        px: 2,
        py: 1,
        bgcolor: '#5a0000',
        borderBottom: '1px solid #ff0000',
        flexShrink: 0,
      }}
    >
      <Typography
        variant="caption"
        sx={{ color: '#ff8080', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}
      >
        {error}
      </Typography>
    </Box>
  )
}
