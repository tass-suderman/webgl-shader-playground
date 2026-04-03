import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import InputBase from '@mui/material/InputBase'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import StopIcon from '@mui/icons-material/Stop'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import FileUploadIcon from '@mui/icons-material/FileUpload'
import { StrudelMirror } from '@strudel/codemirror'
import { prebake } from '@strudel/repl'
import { webaudioOutput, getAudioContext, initAudioOnFirstClick, getSuperdoughAudioController } from '@strudel/webaudio'
import { transpiler } from '@strudel/transpiler'

const DEFAULT_STRUDEL_CODE = `// Strudel live-coding pattern
// Alt+Enter to play/pause, Ctrl+. to stop
note("c3 [e3 g3] b3 [g3 e3]").sound("piano").slow(2)`

export interface StrudelPaneHandle {
  toggle: () => void
}

interface StrudelPaneProps {
  onAnalyserReady: (analyser: AnalyserNode | null) => void
}

const StrudelPane = forwardRef<StrudelPaneHandle, StrudelPaneProps>(function StrudelPane(
  { onAnalyserReady },
  ref,
) {
  const rootRef = useRef<HTMLDivElement>(null)
  const mirrorRef = useRef<StrudelMirror | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const isPlayingRef = useRef(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [strudelTitle, setStrudelTitle] = useState('Strudel Pattern')
  const onAnalyserReadyRef = useRef(onAnalyserReady)
  onAnalyserReadyRef.current = onAnalyserReady

  useImperativeHandle(ref, () => ({
    toggle() {
      if (isPlayingRef.current) {
        mirrorRef.current?.stop().catch(console.error)
      } else {
        mirrorRef.current?.evaluate().catch(console.error)
      }
    },
  }), [])

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
        isPlayingRef.current = started
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

  const handleExport = useCallback(() => {
    const code = mirrorRef.current?.view.state.doc.toString() ?? DEFAULT_STRUDEL_CODE
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const safeName = strudelTitle
      .replace(/[^\w\s.-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^[_\s]+|[_\s]+$/g, '')
      .trim() || 'pattern'
    a.download = safeName + '.strudel'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [strudelTitle])

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      const content = evt.target?.result as string
      if (content !== undefined && mirrorRef.current) {
        const view = mirrorRef.current.view
        view.dispatch({
          changes: { from: 0, to: view.state.doc.length, insert: content },
        })
        const name = file.name.replace(/\.[^.]+$/, '')
        setStrudelTitle(name)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
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
        {/* Editable title */}
        <InputBase
          value={strudelTitle}
          onChange={e => setStrudelTitle(e.target.value)}
          inputProps={{ 'aria-label': 'Strudel pattern title' }}
          sx={{
            color: 'rgba(255,255,255,0.7)',
            fontFamily: 'monospace',
            fontSize: '0.875rem',
            flex: 1,
            minWidth: 0,
            '& input': { p: 0, cursor: 'text' },
          }}
        />

        {/* Import / Export buttons */}
        <Tooltip title="Import pattern from file">
          <IconButton size="small" onClick={handleImportClick} sx={{ color: 'rgba(255,255,255,0.7)' }}>
            <FileUploadIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Export pattern to file">
          <IconButton size="small" onClick={handleExport} sx={{ color: 'rgba(255,255,255,0.7)' }}>
            <FileDownloadIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Button
          variant="contained"
          color="success"
          size="small"
          startIcon={<PlayArrowIcon />}
          onClick={handleRun}
          sx={{ textTransform: 'none', flexShrink: 0 }}
        >
          Play Strudel
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
          Alt+Enter to play/pause · Ctrl+. to stop
        </Typography>
      </Box>

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".strudel,.js,.txt"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

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
})

export default StrudelPane
