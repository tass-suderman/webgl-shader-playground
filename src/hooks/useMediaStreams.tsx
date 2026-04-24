import { useState, useCallback, useRef, createContext, useContext } from 'react'

export interface UseMediaStreamsReturn {
  webcamEnabled: boolean
  micEnabled: boolean
  webcamStream: MediaStream | null
  audioStream: MediaStream | null
  handleToggleWebcam: () => Promise<void>
  handleToggleMic: () => Promise<void>
}

const MediaStreamsContext = createContext<UseMediaStreamsReturn | null>(null)

export const MediaStreamsProvider = ({children}: { children: React.ReactNode}) => {
  const [webcamEnabled, setWebcamEnabled] = useState(false)
  const [micEnabled, setMicEnabled] = useState(false)
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null)
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null)
  // Keep the full display stream alive so that stopping video tracks doesn't
  // end the audio capture session (Chrome terminates the entire session when
  // the video track is stopped).
  const displayStreamRef = useRef<MediaStream | null>(null)

  const stopAudio = useCallback((currentStream: MediaStream | null) => {
    if (currentStream) {
      currentStream.getTracks().forEach(t => t.stop())
    }
    // Also stop any leftover video tracks from getDisplayMedia
    if (displayStreamRef.current) {
      displayStreamRef.current.getTracks().forEach(t => t.stop())
      displayStreamRef.current = null
    }
    setAudioStream(null)
    setMicEnabled(false)
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

  const handleToggleMic = useCallback(async () => {
    if (micEnabled) {
      stopAudio(audioStream)
    } else {
      if (audioStream) {
        audioStream.getTracks().forEach(t => t.stop())
        setAudioStream(null)
      }
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

  return (
    <MediaStreamsContext.Provider value={{
      webcamEnabled,
      micEnabled,
      webcamStream,
      audioStream,
      handleToggleWebcam,
      handleToggleMic,
    }}>
      {children}
    </MediaStreamsContext.Provider>
  )
}

export const useMediaStreams = () => {
  const context = useContext(MediaStreamsContext)
  if (!context) {
    throw new Error('useMediaStreams must be used within a MediaStreamsProvider')
  }
  return context
}

