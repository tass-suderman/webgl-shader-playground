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
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null)
  const [shaderError, setShaderError] = useState<string | null>(null)

  const handleRun = useCallback((code: string) => {
    setShaderSource(code)
  }, [])

  const handleToggleWebcam = useCallback(async () => {
    if (webcamEnabled) {
      if (mediaStream) {
        mediaStream.getTracks().forEach(t => t.stop())
        setMediaStream(null)
      }
      setWebcamEnabled(false)
    } else {
      // Stop any existing stream (e.g. mic) before requesting webcam
      if (mediaStream) {
        mediaStream.getTracks().forEach(t => t.stop())
        setMediaStream(null)
      }
      setMicEnabled(false)
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        setMediaStream(stream)
        setWebcamEnabled(true)
      } catch (e) {
        console.error('Failed to get webcam:', e)
      }
    }
  }, [webcamEnabled, mediaStream])

  const handleToggleMic = useCallback(async () => {
    if (micEnabled) {
      if (mediaStream) {
        mediaStream.getTracks().forEach(t => t.stop())
        setMediaStream(null)
      }
      setMicEnabled(false)
    } else {
      // Stop any existing stream (e.g. webcam) before requesting mic
      if (mediaStream) {
        mediaStream.getTracks().forEach(t => t.stop())
        setMediaStream(null)
      }
      setWebcamEnabled(false)
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        setMediaStream(stream)
        setMicEnabled(true)
      } catch (e) {
        console.error('Failed to get mic:', e)
      }
    }
  }, [micEnabled, mediaStream])

  return (
    <Box sx={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', bgcolor: '#1a1a2e' }}>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <ShaderPane
          shaderSource={shaderSource}
          mediaStream={mediaStream}
          webcamEnabled={webcamEnabled}
          micEnabled={micEnabled}
          onToggleWebcam={handleToggleWebcam}
          onToggleMic={handleToggleMic}
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
