import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ShaderControls from './ShaderControls'

const DEFAULT_PROPS = {
  isPlaying: true,
  isRecording: false,
  isFullscreen: false,
  webcamEnabled: false,
  micEnabled: false,
  systemAudioEnabled: false,
  strudelAnalyser: null,
  volume: 50,
  muted: false,
  onTogglePlay: vi.fn(),
  onToggleWebcam: vi.fn(),
  onToggleMic: vi.fn(),
  onToggleSystemAudio: vi.fn(),
  onVolumeChange: vi.fn(),
  onToggleMute: vi.fn(),
  onStartRecording: vi.fn(),
  onStopRecording: vi.fn(),
  onToggleFullscreen: vi.fn(),
}

describe('ShaderControls', () => {
  it('shows Start Recording button when not recording', () => {
    render(<ShaderControls {...DEFAULT_PROPS} isRecording={false} />)
    expect(screen.getByRole('button', { name: /start recording/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /stop recording/i })).not.toBeInTheDocument()
  })

  it('shows Stop Recording button when recording', () => {
    render(<ShaderControls {...DEFAULT_PROPS} isRecording={true} />)
    expect(screen.getByRole('button', { name: /stop recording/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /start recording/i })).not.toBeInTheDocument()
  })

  it('calls onStartRecording when Start Recording is clicked', async () => {
    const onStartRecording = vi.fn()
    const user = userEvent.setup()
    render(<ShaderControls {...DEFAULT_PROPS} isRecording={false} onStartRecording={onStartRecording} />)
    await user.click(screen.getByRole('button', { name: /start recording/i }))
    expect(onStartRecording).toHaveBeenCalledTimes(1)
  })

  it('calls onStopRecording when Stop Recording is clicked', async () => {
    const onStopRecording = vi.fn()
    const user = userEvent.setup()
    render(<ShaderControls {...DEFAULT_PROPS} isRecording={true} onStopRecording={onStopRecording} />)
    await user.click(screen.getByRole('button', { name: /stop recording/i }))
    expect(onStopRecording).toHaveBeenCalledTimes(1)
  })

  it('shows Fullscreen icon when not in fullscreen', () => {
    render(<ShaderControls {...DEFAULT_PROPS} isFullscreen={false} />)
    // The fullscreen button uses FullscreenIcon (no "exit")
    expect(screen.getByTestId('FullscreenIcon')).toBeInTheDocument()
  })

  it('shows FullscreenExit icon when in fullscreen', () => {
    render(<ShaderControls {...DEFAULT_PROPS} isFullscreen={true} />)
    expect(screen.getByTestId('FullscreenExitIcon')).toBeInTheDocument()
  })

  it('calls onToggleFullscreen when fullscreen button is clicked', async () => {
    const onToggleFullscreen = vi.fn()
    const user = userEvent.setup()
    render(<ShaderControls {...DEFAULT_PROPS} onToggleFullscreen={onToggleFullscreen} />)
    await user.click(screen.getByTestId('FullscreenIcon').closest('button')!)
    expect(onToggleFullscreen).toHaveBeenCalledTimes(1)
  })

  it('calls onTogglePlay when play/pause button is clicked', async () => {
    const onTogglePlay = vi.fn()
    const user = userEvent.setup()
    render(<ShaderControls {...DEFAULT_PROPS} isPlaying={false} onTogglePlay={onTogglePlay} />)
    await user.click(screen.getByTestId('PlayArrowIcon').closest('button')!)
    expect(onTogglePlay).toHaveBeenCalledTimes(1)
  })

  it('shows Pause icon when playing', () => {
    render(<ShaderControls {...DEFAULT_PROPS} isPlaying={true} />)
    expect(screen.getByTestId('PauseIcon')).toBeInTheDocument()
  })

  it('shows Play icon when paused', () => {
    render(<ShaderControls {...DEFAULT_PROPS} isPlaying={false} />)
    expect(screen.getByTestId('PlayArrowIcon')).toBeInTheDocument()
  })

  it('calls onToggleWebcam when webcam button is clicked', async () => {
    const onToggleWebcam = vi.fn()
    const user = userEvent.setup()
    render(<ShaderControls {...DEFAULT_PROPS} onToggleWebcam={onToggleWebcam} />)
    await user.click(screen.getByTestId('VideocamOffIcon').closest('button')!)
    expect(onToggleWebcam).toHaveBeenCalledTimes(1)
  })

  it('calls onToggleMic when mic button is clicked', async () => {
    const onToggleMic = vi.fn()
    const user = userEvent.setup()
    render(<ShaderControls {...DEFAULT_PROPS} onToggleMic={onToggleMic} />)
    await user.click(screen.getByTestId('MicOffIcon').closest('button')!)
    expect(onToggleMic).toHaveBeenCalledTimes(1)
  })

  it('renders channel status chips based on enabled state', () => {
    render(<ShaderControls {...DEFAULT_PROPS} webcamEnabled={true} strudelAnalyser={{} as AnalyserNode} />)
    expect(screen.getByText('iChannel0: Webcam')).toBeInTheDocument()
    expect(screen.getByText('iChannel2: Strudel')).toBeInTheDocument()
  })
})
