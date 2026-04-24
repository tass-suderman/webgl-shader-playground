import { Box, Typography }from '@mui/material'
import { UniformEntry, UNIFORMS } from '../../utility/shader/uniformsData'
import { InformationPanel } from '../InformationPanel/InformationPanel';

export default function UniformsPanel() {
  const renderUniform = (u: UniformEntry) => (
    <Box key={u.name} sx={{ mb: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
        <Typography
          component="code"
          sx={{ bgcolor: 'background.button', px: 0.75, py: 0.25, borderRadius: 0.5, fontSize: '0.8rem', fontFamily: 'monospace', color: '#9cdcfe' }}
        >
          {u.name}
        </Typography>
        <Typography
          component="span"
          sx={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#4ec9b0' }}
        >
          {u.type}
        </Typography>
      </Box>
      <Typography variant="caption" sx={{ color: 'textColor.muted', fontFamily: 'monospace', display: 'block', mt: 0.25 }}>
        {u.description}
      </Typography>
    </Box>
  )

  return (
    <>
      <InformationPanel
        renderer={renderUniform}
        items={UNIFORMS}
        footer={(
          <Typography
            variant="caption"
            sx={{
              color: 'textColor.muted',
              fontFamily: 'monospace',
              display: 'block', 
              mt: 2 
            }}>
							These uniforms are compatible with <code style={{ color: '#9cdcfe' }}>ShaderToy</code> shaders.
          </Typography>
        )}
      />
    </>
  )
}
