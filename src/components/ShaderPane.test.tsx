import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// ---------------------------------------------------------------------------
// Mock the WebGL hook so canvas setup doesn't throw in jsdom
// ---------------------------------------------------------------------------
vi.mock('../hooks/useWebGL', () => ({ useWebGL: vi.fn() }))

// ---------------------------------------------------------------------------
// MediaRecorder mock (class so it is constructable with `new`)
// ---------------------------------------------------------------------------

type DataAvailableHandler = (e: { data: Blob }) => void
type StopHandler = () => void

class MockMediaRecorder {
  state: RecordingState = 'inactive'
  mimeType: string
  ondataavailable: DataAvailableHandler | null = null
  onstop: StopHandler | null = null

  static isTypeSupported = vi.fn((_type: string) => false)
  static instances: MockMediaRecorder[] = []

  constructor(_stream: MediaStream, options?: MediaRecorderOptions) {
    this.mimeType = options?.mimeType ?? 'video/webm'
    MockMediaRecorder.instances.push(this)
  }

  start() { this.state = 'recording' }

  stop() {
    this.state = 'inactive'
    this.onstop?.()
  }

  /** Test helper – fire ondataavailable with synthetic data */
  emitData(data: Blob) { this.ondataavailable?.({ data }) }
}

// ---------------------------------------------------------------------------
// MediaStream mock factory
// ---------------------------------------------------------------------------

interface MockStreamInit {
  videoTracks?: MediaStreamTrack[]
  audioTracks?: MediaStreamTrack[]
}

function makeMockMediaStream({ videoTracks = [], audioTracks = [] }: MockStreamInit = {}) {
  return {
    getVideoTracks: () => videoTracks,
    getAudioTracks: () => audioTracks,
    getTracks: () => [...videoTracks, ...audioTracks],
  } as unknown as MediaStream
}

// Constructable MediaStream stub that records what tracks were passed to each `new` call
let lastNewMediaStreamTracks: MediaStreamTrack[] = []

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MediaStreamMock = vi.fn(function MockMediaStream(this: any, tracks?: MediaStreamTrack[]) {
  lastNewMediaStreamTracks = tracks ?? []
  const audioTracks = (tracks ?? []).filter(t => t.kind === 'audio')
  const videoTracks = (tracks ?? []).filter(t => t.kind === 'video')
  Object.assign(this, makeMockMediaStream({ videoTracks, audioTracks }))
})

// ---------------------------------------------------------------------------
// Component under test (imported after all mocks)
// ---------------------------------------------------------------------------
import ShaderPane from './ShaderPane'

// ---------------------------------------------------------------------------
// Shared default props
// ---------------------------------------------------------------------------

const FAKE_VIDEO_TRACK = { kind: 'video' } as MediaStreamTrack

const DEFAULT_PROPS = {
  shaderSource: 'void main() {}',
  webcamStream: null,
  audioStream: null,
  strudelAudioStream: null,
  webcamEnabled: false,
  micEnabled: false,
  systemAudioEnabled: false,
  onToggleWebcam: vi.fn(),
  onToggleMic: vi.fn(),
  onToggleSystemAudio: vi.fn(),
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks()
  MockMediaRecorder.instances = []
  lastNewMediaStreamTracks = []

  vi.stubGlobal('MediaRecorder', MockMediaRecorder)
  vi.stubGlobal('MediaStream', MediaStreamMock)
  vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:test'), revokeObjectURL: vi.fn() })

  Object.defineProperty(HTMLCanvasElement.prototype, 'captureStream', {
    writable: true,
    configurable: true,
    value: vi.fn(() => makeMockMediaStream({ videoTracks: [FAKE_VIDEO_TRACK] })),
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ShaderPane – record button', () => {
  it('shows the Start Recording button by default', () => {
    render(<ShaderPane {...DEFAULT_PROPS} />)
    expect(screen.getByRole('button', { name: /start recording/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /stop recording/i })).not.toBeInTheDocument()
  })

  it('switches to Stop Recording button when recording starts', async () => {
    const user = userEvent.setup()
    render(<ShaderPane {...DEFAULT_PROPS} />)
    await user.click(screen.getByRole('button', { name: /start recording/i }))
    expect(screen.queryByRole('button', { name: /start recording/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /stop recording/i })).toBeInTheDocument()
  })

  it('reverts to Start Recording button when Stop Recording is clicked', async () => {
    const user = userEvent.setup()
    render(<ShaderPane {...DEFAULT_PROPS} />)
    await user.click(screen.getByRole('button', { name: /start recording/i }))
    await user.click(screen.getByRole('button', { name: /stop recording/i }))
    expect(screen.getByRole('button', { name: /start recording/i })).toBeInTheDocument()
  })

  it('creates a MediaRecorder when recording starts', async () => {
    const user = userEvent.setup()
    render(<ShaderPane {...DEFAULT_PROPS} />)
    await user.click(screen.getByRole('button', { name: /start recording/i }))
    expect(MockMediaRecorder.instances).toHaveLength(1)
    expect(MockMediaRecorder.instances[0].state).toBe('recording')
  })

  it('stops the MediaRecorder when Stop Recording is clicked', async () => {
    const user = userEvent.setup()
    render(<ShaderPane {...DEFAULT_PROPS} />)
    await user.click(screen.getByRole('button', { name: /start recording/i }))
    await user.click(screen.getByRole('button', { name: /stop recording/i }))
    expect(MockMediaRecorder.instances[0].state).toBe('inactive')
  })

  it('calls showSaveFilePicker after stop when the API is available', async () => {
    const mockWritable = {
      write: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
    }
    const mockHandle = { createWritable: vi.fn().mockResolvedValue(mockWritable) }
    const mockSaveFilePicker = vi.fn().mockResolvedValue(mockHandle)
    vi.stubGlobal('showSaveFilePicker', mockSaveFilePicker)

    const user = userEvent.setup()
    render(<ShaderPane {...DEFAULT_PROPS} />)
    await user.click(screen.getByRole('button', { name: /start recording/i }))

    const recorder = MockMediaRecorder.instances[0]
    act(() => recorder.emitData(new Blob(['v'], { type: 'video/webm' })))
    await user.click(screen.getByRole('button', { name: /stop recording/i }))

    await act(async () => { await new Promise(r => setTimeout(r, 20)) })

    expect(mockSaveFilePicker).toHaveBeenCalledWith(
      expect.objectContaining({ suggestedName: expect.stringMatching(/recording\.(mp4|webm)/) }),
    )
    expect(mockWritable.write).toHaveBeenCalled()
    expect(mockWritable.close).toHaveBeenCalled()
  })

  it('falls back to anchor download when showSaveFilePicker is not available', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).showSaveFilePicker

    const user = userEvent.setup()
    // Render BEFORE spying on appendChild so React can mount the component
    render(<ShaderPane {...DEFAULT_PROPS} />)

    // Now intercept the anchor-based download
    const appendSpy = vi.spyOn(document.body, 'appendChild')
      .mockReturnValue(document.body as unknown as ReturnType<typeof document.body.appendChild>)
    vi.spyOn(document.body, 'removeChild')
      .mockReturnValue(document.body as unknown as ReturnType<typeof document.body.removeChild>)
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockReturnValue(undefined)

    await user.click(screen.getByRole('button', { name: /start recording/i }))

    const recorder = MockMediaRecorder.instances[0]
    act(() => recorder.emitData(new Blob(['v'], { type: 'video/webm' })))
    await user.click(screen.getByRole('button', { name: /stop recording/i }))

    await act(async () => { await new Promise(r => setTimeout(r, 20)) })

    const anchor = appendSpy.mock.calls[0]?.[0] as HTMLAnchorElement | undefined
    expect(anchor).toBeDefined()
    expect(anchor!.download).toMatch(/recording\.(mp4|webm)/)
    expect(anchor!.href).toBe('blob:test')
  })

  it('does not start recording when captureStream is not supported', async () => {
    Object.defineProperty(HTMLCanvasElement.prototype, 'captureStream', {
      writable: true,
      configurable: true,
      value: undefined,
    })
    const user = userEvent.setup()
    render(<ShaderPane {...DEFAULT_PROPS} />)
    await user.click(screen.getByRole('button', { name: /start recording/i }))
    expect(screen.getByRole('button', { name: /start recording/i })).toBeInTheDocument()
    expect(MockMediaRecorder.instances).toHaveLength(0)
  })

  it('passes strudelAudioStream audio tracks to the MediaStream constructor', async () => {
    const audioTrack = { kind: 'audio', id: 'strudel-track' } as MediaStreamTrack
    const strudelStream = makeMockMediaStream({ audioTracks: [audioTrack] })

    const user = userEvent.setup()
    render(<ShaderPane {...DEFAULT_PROPS} strudelAudioStream={strudelStream} />)
    await user.click(screen.getByRole('button', { name: /start recording/i }))

    expect(lastNewMediaStreamTracks).toContain(audioTrack)
  })

  it('falls back to audioStream tracks when no strudelAudioStream audio is available', async () => {
    const audioTrack = { kind: 'audio', id: 'mic-track' } as MediaStreamTrack
    const micStream = makeMockMediaStream({ audioTracks: [audioTrack] })

    const user = userEvent.setup()
    render(<ShaderPane {...DEFAULT_PROPS} audioStream={micStream} />)
    await user.click(screen.getByRole('button', { name: /start recording/i }))

    expect(lastNewMediaStreamTracks).toContain(audioTrack)
  })
})
