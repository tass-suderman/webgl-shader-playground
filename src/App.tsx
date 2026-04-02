import { useState, useCallback } from 'react'
import Box from '@mui/material/Box'
import ShaderPane from './components/ShaderPane'
import EditorPane from './components/EditorPane'
import { DEFAULT_SHADER } from './shaders/default'

export default function App() {
  const [shaderSource, setShaderSource] = useState<string>(DEFAULT_SHADER)
  const [pendingSource, setPendingSource] = useState<string>(DEFAULT_SHADER)
  const [webcamEnabled, setWebcamEnabled] = useState(false)
  const [micEnabled, setMicEnabled] = useState(false)
  const [systemAudioEnabled, setSystemAudioEnabled] = useState(false)
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null)
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null)
  const [shaderError, setShaderError] = useState<string | null>(null)

  const handleRun = useCallback((code: string) => {
    setShaderSource(code)
  }, [])

  const handleToggleWebcam = useCallback(async () => {
    if (webcamEnabled) {
      if (webcamStream) {
        webcamStream.getTracks().forEach(t => t.stop())
        setWebcamStream(null)
      }
      setWebcamEnabled(false)
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        // Stop webcam when the track ends (e.g. user revokes permission)
        stream.getVideoTracks().forEach(track => {
          track.onended = () => {
            setWebcamStream(null)
            setWebcamEnabled(false)
          }
        })
        setWebcamStream(stream)
        setWebcamEnabled(true)
      } catch (e) {
        console.error('Failed to get webcam:', e)
      }
    }
  }, [webcamEnabled, webcamStream])

  const stopAudio = useCallback(() => {
    if (audioStream) {
      audioStream.getTracks().forEach(t => t.stop())
      setAudioStream(null)
    }
    setMicEnabled(false)
    setSystemAudioEnabled(false)
  }, [audioStream])

  const handleToggleMic = useCallback(async () => {
    if (micEnabled) {
      stopAudio()
    } else {
      // Stop any existing audio source first
      if (audioStream) {
        audioStream.getTracks().forEach(t => t.stop())
        setAudioStream(null)
      }
      setSystemAudioEnabled(false)
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        stream.getAudioTracks().forEach(track => {
          track.onended = () => {
            setAudioStream(null)
            setMicEnabled(false)
          }
        })
        setAudioStream(stream)
        setMicEnabled(true)
      } catch (e) {
        console.error('Failed to get mic:', e)
      }
    }
  }, [micEnabled, audioStream, stopAudio])

  const handleToggleSystemAudio = useCallback(async () => {
    if (systemAudioEnabled) {
      stopAudio()
    } else {
      // Stop any existing audio source first
      if (audioStream) {
        audioStream.getTracks().forEach(t => t.stop())
        setAudioStream(null)
      }
      setMicEnabled(false)
      try {
        // getDisplayMedia is the only browser API that can capture system audio output.
        // Most browsers require video:true even when only audio is needed.
        // Note: browser support and user-facing dialogs vary – Chrome shows a tab/window
        // picker with an "also share audio" checkbox, Firefox may not support system audio.
        const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
        const audioTracks = displayStream.getAudioTracks()
        if (audioTracks.length === 0) {
          // No audio was shared – stop everything and bail out
          displayStream.getTracks().forEach(t => t.stop())
          console.warn('No system audio track found. Make sure to enable audio sharing in the dialog.')
          return
        }
        // Stop the video capture immediately – we only need the audio
        displayStream.getVideoTracks().forEach(t => t.stop())
        // Build a new stream that contains only the audio tracks
        const audioOnlyStream = new MediaStream(audioTracks)
        audioTracks.forEach(track => {
          track.onended = () => {
            setAudioStream(null)
            setSystemAudioEnabled(false)
          }
        })
        setAudioStream(audioOnlyStream)
        setSystemAudioEnabled(true)
      } catch (e) {
        console.error('Failed to get system audio:', e)
      }
    }
  }, [systemAudioEnabled, audioStream, stopAudio])

  return (
    <Box sx={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', bgcolor: '#1a1a2e' }}>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <ShaderPane
          shaderSource={shaderSource}
          webcamStream={webcamStream}
          audioStream={audioStream}
          webcamEnabled={webcamEnabled}
          micEnabled={micEnabled}
          systemAudioEnabled={systemAudioEnabled}
          onToggleWebcam={handleToggleWebcam}
          onToggleMic={handleToggleMic}
          onToggleSystemAudio={handleToggleSystemAudio}
          onShaderError={setShaderError}
        />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <EditorPane
          initialCode={DEFAULT_SHADER}
          onRun={handleRun}
          pendingSource={pendingSource}
          onCodeChange={setPendingSource}
          shaderError={shaderError}
        />
      </Box>
    </Box>
  )
}
