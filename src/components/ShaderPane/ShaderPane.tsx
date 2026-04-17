import { forwardRef, useRef, useState, useCallback, useEffect, useImperativeHandle } from 'react'
import Box from '@mui/material/Box'
import { useWebGL } from '../../hooks/useWebGL'
import ShaderControls from '../ShaderControls/ShaderControls'
import { useStrudelAnalyzer } from '../../hooks/useStrudelAnalyzer'
import { useStrudelAudioStream } from '../../hooks/useStrudelAudioStream'
import { useMediaStreams } from '../../hooks/useMediaStreams'
import { downloadBlob } from '../../utility/download'
import { useAppStorage } from '../../hooks/useAppStorage'

export interface ShaderPaneHandle {
  pause: () => void
  unpause: () => void
  togglePlay: () => void
  startRecording: () => void
  stopRecording: () => void
  toggleFullscreen: () => void
}

interface ShaderPaneProps {
  shaderSource: string
  onShaderError?: (error: string | null) => void
  editorCollapsed?: boolean
  onToggleEditorCollapsed?: () => void
  isMobile?: boolean
  hideControls?: boolean
  onPlayStateChange?: (playing: boolean) => void
  onRecordingStateChange?: (recording: boolean) => void
  onFullscreenStateChange?: (fullscreen: boolean) => void
  isImmersive?: boolean
  onToggleImmersive?: () => void
}

export default forwardRef<ShaderPaneHandle, ShaderPaneProps>(function ShaderPane({
  shaderSource,
  onShaderError,
  editorCollapsed,
  onToggleEditorCollapsed,
  isMobile,
  hideControls = false,
  onPlayStateChange,
  onRecordingStateChange,
  onFullscreenStateChange,
  isImmersive,
  onToggleImmersive,
}: ShaderPaneProps, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
	const { analyzer } = useStrudelAnalyzer()
	const { strudelAudioStream } = useStrudelAudioStream()
	const { webcamStream, audioStream } = useMediaStreams()

	const { immersiveOpacity } = useAppStorage()

  useWebGL(canvasRef, {
    shaderSource,
    webcamStream,
    audioStream,
    isPlaying,
		strudelAnalyser: analyzer,
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

    // Prefer Strudel audio; fall back to mic
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

  // Expose imperative controls to parent (after handlers are defined)
  useImperativeHandle(ref, () => ({
    pause() { setIsPlaying(false) },
    unpause() { setIsPlaying(true) },
    togglePlay() { setIsPlaying(p => !p) },
    startRecording: handleStartRecording,
    stopRecording: handleStopRecording,
    toggleFullscreen: handleFullscreen,
  }), [handleStartRecording, handleStopRecording, handleFullscreen])

  // Notify parent of state changes (used when controls are lifted outside the pane)
  useEffect(() => { onPlayStateChange?.(isPlaying) }, [isPlaying, onPlayStateChange])
  useEffect(() => { onRecordingStateChange?.(isRecording) }, [isRecording, onRecordingStateChange])
  useEffect(() => { onFullscreenStateChange?.(isFullscreen) }, [isFullscreen, onFullscreenStateChange])

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
				opacity: immersiveOpacity ?? '100%',
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

      {!hideControls && (
        <ShaderControls
          isPlaying={isPlaying}
          isRecording={isRecording}
          isFullscreen={isFullscreen}
          onTogglePlay={() => setIsPlaying(p => !p)}
          onStartRecording={handleStartRecording}
          onStopRecording={handleStopRecording}
          onToggleFullscreen={handleFullscreen}
          editorCollapsed={editorCollapsed}
          onToggleEditorCollapsed={onToggleEditorCollapsed}
          isMobile={isMobile}
          isImmersive={isImmersive}
          onToggleImmersive={onToggleImmersive}
        />
      )}
    </Box>
  )
})
