import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'

interface ChannelStatusChipsProps {
  webcamEnabled: boolean
  micEnabled: boolean
  strudelAnalyser?: AnalyserNode | null
}

export default function ChannelStatusChips({
  webcamEnabled,
  micEnabled,
  strudelAnalyser,
}: ChannelStatusChipsProps) {
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
      {strudelAnalyser && (
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
