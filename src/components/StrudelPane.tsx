import { useCallback, useEffect, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import StopIcon from '@mui/icons-material/Stop'
import { StrudelMirror } from '@strudel/codemirror'
import { prebake } from '@strudel/repl'
import { webaudioOutput, getAudioContext, initAudioOnFirstClick, getSuperdoughAudioController } from '@strudel/webaudio'
import { transpiler } from '@strudel/transpiler'

const DEFAULT_STRUDEL_CODE = `// Strudel live-coding pattern
// Ctrl+Enter to evaluate, Ctrl+. to stop
note("c3 [e3 g3] b3 [g3 e3]").sound("piano").slow(2)`

interface StrudelPaneProps {
  onAnalyserReady: (analyser: AnalyserNode | null) => void
}

export default function StrudelPane({ onAnalyserReady }: StrudelPaneProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const mirrorRef = useRef<StrudelMirror | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const onAnalyserReadyRef = useRef(onAnalyserReady)
  onAnalyserReadyRef.current = onAnalyserReady

  useEffect(() => {
    if (!rootRef.current) return
    initAudioOnFirstClick()
    const mirror = new StrudelMirror({
      root: rootRef.current,
      initialCode: DEFAULT_STRUDEL_CODE,
      prebake,
      defaultOutput: webaudioOutput,
      getTime: () => getAudioContext()?.currentTime ?? 0,
      transpiler,
      solo: false,
      onToggle: (started: boolean) => {
        setIsPlaying(started)
        if (started && !analyserRef.current) {
          const ctx = getAudioContext()
          const controller = getSuperdoughAudioController()
          if (ctx && controller?.output?.destinationGain) {
            const analyser = ctx.createAnalyser()
            analyser.fftSize = 256
            controller.output.destinationGain.connect(analyser)
            analyserRef.current = analyser
            onAnalyserReadyRef.current(analyser)
          }
        }
        if (!started && analyserRef.current) {
          analyserRef.current.disconnect()
          analyserRef.current = null
          onAnalyserReadyRef.current(null)
        }
      },
    })
    mirrorRef.current = mirror
    return () => {
      if (analyserRef.current) {
        analyserRef.current.disconnect()
        analyserRef.current = null
        onAnalyserReadyRef.current(null)
      }
      mirror.stop().catch(console.error)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleRun = useCallback(() => {
    mirrorRef.current?.evaluate().catch(console.error)
  }, [])

  const handleStop = useCallback(() => {
    mirrorRef.current?.stop().catch(console.error)
  }, [])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#1e1e1e' }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1,
          bgcolor: '#252526',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          flexShrink: 0,
          gap: 1,
        }}
      >
        <Typography
          sx={{
            color: 'rgba(255,255,255,0.7)',
            fontFamily: 'monospace',
            fontSize: '0.875rem',
            flex: 1,
            minWidth: 0,
          }}
        >
          Strudel Pattern
        </Typography>
        <Button
          variant="contained"
          color="success"
          size="small"
          startIcon={<PlayArrowIcon />}
          onClick={handleRun}
          sx={{ textTransform: 'none', flexShrink: 0 }}
        >
          Run Strudel
        </Button>
        <Button
          variant="outlined"
          color="error"
          size="small"
          startIcon={<StopIcon />}
          onClick={handleStop}
          disabled={!isPlaying}
          sx={{ textTransform: 'none', flexShrink: 0 }}
        >
          Stop
        </Button>
      </Box>

      {/* Keyboard hint */}
      <Box
        sx={{
          px: 2,
          py: 0.5,
          bgcolor: '#252526',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          flexShrink: 0,
        }}
      >
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace' }}>
          Ctrl+Enter to run · Ctrl+. to stop
        </Typography>
      </Box>

      {/* Strudel CodeMirror editor */}
      <Box
        ref={rootRef}
        sx={{
          flex: 1,
          overflow: 'auto',
          '& .cm-editor': { minHeight: '100%', fontSize: '13px' },
          '& .cm-scroller': { fontFamily: 'monospace' },
        }}
      />
    </Box>
  )
}
