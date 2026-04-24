import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import { useStrudelAnalyzer } from '../../hooks/useStrudelAnalyzer'
import { useMediaStreams } from '../../hooks/useMediaStreams';

export default () => {
  const { analyzer } = useStrudelAnalyzer();
  const { 
    webcamEnabled,
    micEnabled,
  } = useMediaStreams()

  return (
    <Box sx={{ display: 'contents' }}>
      {webcamEnabled && (
        <Chip
          label="iChannel0: Webcam"
          size="small"
          color="primary"
          variant="outlined"
          sx={{ fontSize: '0.65rem' }}
        />
      )}
      {micEnabled && (
        <Chip
          label="iChannel1: Mic"
          size="small"
          color="primary"
          variant="outlined"
          sx={{ fontSize: '0.65rem' }}
        />
      )}
      {analyzer && (
        <Chip
          label="iChannel2: Strudel"
          size="small"
          color="success"
          variant="outlined"
          sx={{ fontSize: '0.65rem' }}
        />
      )}
    </Box>
  )
}
