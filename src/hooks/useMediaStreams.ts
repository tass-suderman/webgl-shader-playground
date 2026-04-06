import { useState, useCallback } from 'react'

export interface UseMediaStreamsReturn {
  webcamEnabled: boolean
  micEnabled: boolean
  systemAudioEnabled: boolean
  webcamStream: MediaStream | null
  audioStream: MediaStream | null
  handleToggleWebcam: () => Promise<void>
  handleToggleMic: () => Promise<void>
  handleToggleSystemAudio: () => Promise<void>
}

export function useMediaStreams(): UseMediaStreamsReturn {
  const [webcamEnabled, setWebcamEnabled] = useState(false)
  const [micEnabled, setMicEnabled] = useState(false)
  const [systemAudioEnabled, setSystemAudioEnabled] = useState(false)
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null)
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null)

  const stopAudio = useCallback((currentStream: MediaStream | null) => {
    if (currentStream) {
      currentStream.getTracks().forEach(t => t.stop())
    }
    setAudioStream(null)
    setMicEnabled(false)
    setSystemAudioEnabled(false)
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
      stopAudio(audioStream)
    } else {
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

  return {
    webcamEnabled,
    micEnabled,
    systemAudioEnabled,
    webcamStream,
    audioStream,
    handleToggleWebcam,
    handleToggleMic,
    handleToggleSystemAudio,
  }
}
