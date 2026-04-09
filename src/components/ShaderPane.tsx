import { forwardRef, useRef, useState, useCallback, useEffect, useImperativeHandle } from 'react'
import Box from '@mui/material/Box'
import { useWebGL } from '../hooks/useWebGL'
import ShaderControls from './shader/ShaderControls'

// Download a blob via a temporary anchor element (fallback when showSaveFilePicker is unavailable)
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export interface ShaderPaneHandle {
  pause: () => void
}

interface ShaderPaneProps {
  shaderSource: string
  webcamStream: MediaStream | null
  audioStream: MediaStream | null
  strudelAnalyser?: AnalyserNode | null
  /** MediaStream carrying the Strudel audio output – used for recording */
  strudelAudioStream?: MediaStream | null
  webcamEnabled: boolean
  micEnabled: boolean
  onToggleWebcam: () => void
  onToggleMic: () => void
  onShaderError?: (error: string | null) => void
}

export default forwardRef<ShaderPaneHandle, ShaderPaneProps>(function ShaderPane({
  shaderSource,
  webcamStream,
  audioStream,
  strudelAnalyser,
  strudelAudioStream,
  webcamEnabled,
  micEnabled,
  onToggleWebcam,
  onToggleMic,
  onShaderError,
}: ShaderPaneProps, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])

  useImperativeHandle(ref, () => ({
    pause() {
      setIsPlaying(false)
    },
  }), [])

  useWebGL(canvasRef, {
    shaderSource,
    webcamStream,
    audioStream,
    strudelAnalyser,
    isPlaying,
    onError: onShaderError,
  })

  const handleFullscreen = useCallback(() => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }, [])

  const handleStartRecording = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || typeof canvas.captureStream !== 'function') return

    const canvasStream = canvas.captureStream(30)

    // Prefer Strudel audio; fall back to mic / system audio
    const audioTracks =
      strudelAudioStream && strudelAudioStream.getAudioTracks().length > 0
        ? strudelAudioStream.getAudioTracks()
        : (audioStream?.getAudioTracks() ?? [])

    const recordStream = new MediaStream([
      ...canvasStream.getVideoTracks(),
      ...audioTracks,
    ])

    const mimeType = MediaRecorder.isTypeSupported('video/mp4')
      ? 'video/mp4'
      : 'video/webm'

    const recorder = new MediaRecorder(recordStream, { mimeType })

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        recordedChunksRef.current.push(e.data)
      }
    }

    recorder.onstop = async () => {
      const chunks = recordedChunksRef.current.splice(0)
      if (chunks.length === 0) return
      const blob = new Blob(chunks, { type: recorder.mimeType || mimeType })
      const ext = (recorder.mimeType || mimeType).includes('mp4') ? 'mp4' : 'webm'
      const filename = `recording.${ext}`

      // showSaveFilePicker is part of the File System Access API and not yet
      // in TypeScript's lib.dom.d.ts – cast through unknown to avoid using any.
      type ShowSaveFilePicker = (options: {
        suggestedName?: string
        types?: { description: string; accept: Record<string, string[]> }[]
      }) => Promise<{ createWritable: () => Promise<{ write: (data: Blob) => Promise<void>; close: () => Promise<void> }> }>
      const winFSA = window as Window & { showSaveFilePicker?: ShowSaveFilePicker }

      if (typeof winFSA.showSaveFilePicker === 'function') {
        try {
          const handle = await winFSA.showSaveFilePicker({
            suggestedName: filename,
            types: [{ description: 'Video file', accept: { [(recorder.mimeType || mimeType)]: [`.${ext}`] } }],
          })
          const writable = await handle.createWritable()
          await writable.write(blob)
          await writable.close()
          return
        } catch (err) {
          // AbortError means user cancelled – do nothing; anything else falls through to anchor download
          if ((err as DOMException).name === 'AbortError') return
        }
      }

      downloadBlob(blob, filename)
    }

    recordedChunksRef.current = []
    recorder.start()
    mediaRecorderRef.current = recorder
    setIsRecording(true)
  }, [audioStream, strudelAudioStream])

  const handleStopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop()
    }
    setIsRecording(false)
  }, [])

  // Stop any active recording when the component unmounts
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
    }
  }, [])

  useEffect(() => {
    const handleFSChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFSChange)
    return () => document.removeEventListener('fullscreenchange', handleFSChange)
  }, [])

  return (
    <Box
      ref={containerRef}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: '#000',
        position: 'relative',
      }}
    >
      {/* Canvas fills pane */}
      <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: '100%', display: 'block' }}
        />
      </Box>

      <ShaderControls
        isPlaying={isPlaying}
        isRecording={isRecording}
        isFullscreen={isFullscreen}
        webcamEnabled={webcamEnabled}
        micEnabled={micEnabled}
        strudelAnalyser={strudelAnalyser}
        onTogglePlay={() => setIsPlaying(p => !p)}
        onToggleWebcam={onToggleWebcam}
        onToggleMic={onToggleMic}
        onStartRecording={handleStartRecording}
        onStopRecording={handleStopRecording}
        onToggleFullscreen={handleFullscreen}
      />
    </Box>
  )
})
