import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

// ---------------------------------------------------------------------------
// Module mocks – hoisted so they run before imports
// ---------------------------------------------------------------------------

const { mockEvaluate, mockStop, mockSetCode, mockClear, mockEditorDestroy } = vi.hoisted(() => ({
  mockEvaluate: vi.fn().mockResolvedValue(undefined),
  mockStop: vi.fn().mockResolvedValue(undefined),
  mockSetCode: vi.fn(),
  mockClear: vi.fn(),
  mockEditorDestroy: vi.fn(),
}))

const mockMirror = vi.hoisted(() => ({
  code: '// initial strudel code',
  evaluate: mockEvaluate,
  stop: mockStop,
  setCode: mockSetCode,
  clear: mockClear,
  editor: { state: { doc: { toString: () => '', length: 0 } }, dispatch: vi.fn(), destroy: mockEditorDestroy },
}))

vi.mock('@strudel/codemirror', () => ({
  // Use a regular function so `new StrudelMirror(...)` returns mockMirror
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  StrudelMirror: vi.fn(function MockStrudelMirror(this: unknown) { return mockMirror } as unknown as new (...a: unknown[]) => typeof mockMirror),
  codemirrorSettings: { get: () => ({}) },
}))
vi.mock('@strudel/repl', () => ({ prebake: vi.fn().mockResolvedValue(undefined) }))
vi.mock('@strudel/transpiler', () => ({ transpiler: {} }))
vi.mock('@strudel/webaudio', () => ({
  webaudioOutput: {},
  getAudioContext: vi.fn(() => null),
  initAudioOnFirstClick: vi.fn(),
  getSuperdoughAudioController: vi.fn(() => null),
  registerSynthSounds: vi.fn(),
  registerZZFXSounds: vi.fn(),
}))

// ---------------------------------------------------------------------------
// Component under test (imported after mocks are set up)
// ---------------------------------------------------------------------------
import StrudelPane from './StrudelPane'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let activeSpies: Array<{ mockRestore(): void }> = []

function mockDownload() {
  const appendSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => document.body as unknown as ReturnType<typeof document.body.appendChild>)
  const removeSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => document.body as unknown as ReturnType<typeof document.body.removeChild>)
  const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  activeSpies.push(appendSpy, removeSpy, clickSpy)
  vi.stubGlobal('URL', {
    createObjectURL: vi.fn(() => 'blob:fake-url'),
    revokeObjectURL: vi.fn(),
  })
  return { appendSpy, removeSpy, clickSpy }
}

function restoreDownload() {
  activeSpies.forEach(s => s.mockRestore())
  activeSpies = []
  vi.unstubAllGlobals()
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('StrudelPane', () => {
  const noop = () => {}

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockMirror.code = '// initial strudel code'
  })

  afterEach(() => {
    restoreDownload()
  })

  it('renders the default title', () => {
    render(<StrudelPane onAnalyserReady={noop} />)
    const input = screen.getByRole('textbox', { name: /strudel pattern title/i })
    expect(input).toHaveValue('Strudel Pattern')
  })

  it('title input is editable', async () => {
    const user = userEvent.setup()
    render(<StrudelPane onAnalyserReady={noop} />)
    const input = screen.getByRole('textbox', { name: /strudel pattern title/i })
    await user.clear(input)
    await user.type(input, 'My Beat')
    expect(input).toHaveValue('My Beat')
  })

  it('export button triggers a download with the current title as filename', async () => {
    const user = userEvent.setup()
    render(<StrudelPane onAnalyserReady={noop} />)
    const { appendSpy } = mockDownload()
    await user.click(screen.getByRole('button', { name: /export pattern to file/i }))
    const anchor = appendSpy.mock.calls[0]?.[0] as HTMLAnchorElement | undefined
    expect(anchor).toBeDefined()
    expect(anchor!.download).toBe('Strudel Pattern.strudel')
    expect(anchor!.href).toBe('blob:fake-url')
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:fake-url')
  })

  it('export button uses updated title when title has been changed', async () => {
    const user = userEvent.setup()
    render(<StrudelPane onAnalyserReady={noop} />)
    const input = screen.getByRole('textbox', { name: /strudel pattern title/i })
    await user.clear(input)
    await user.type(input, 'Groove Pattern')
    const { appendSpy } = mockDownload()
    await user.click(screen.getByRole('button', { name: /export pattern to file/i }))
    const anchor = appendSpy.mock.calls[0]?.[0] as HTMLAnchorElement | undefined
    expect(anchor!.download).toBe('Groove Pattern.strudel')
  })

  it('export sanitizes special chars in title', async () => {
    const user = userEvent.setup()
    render(<StrudelPane onAnalyserReady={noop} />)
    const input = screen.getByRole('textbox', { name: /strudel pattern title/i })
    await user.clear(input)
    await user.type(input, 'Hello/World:Test')
    const { appendSpy } = mockDownload()
    await user.click(screen.getByRole('button', { name: /export pattern to file/i }))
    const anchor = appendSpy.mock.calls[0]?.[0] as HTMLAnchorElement | undefined
    expect(anchor!.download).not.toContain('/')
    expect(anchor!.download).not.toContain(':')
    expect(anchor!.download).toMatch(/\.strudel$/)
  })

  it('export uses the mirror code content (not undefined / default)', async () => {
    mockMirror.code = 'note("d4").sound("piano")'
    const user = userEvent.setup()
    const blobSpy = vi.spyOn(window, 'Blob').mockImplementation(function (this: Blob, content?: BlobPart[]) {
      Object.defineProperty(this, '_content', { value: content })
      return this
    } as unknown as typeof Blob)
    activeSpies.push(blobSpy)

    render(<StrudelPane onAnalyserReady={noop} />)
    mockDownload()
    await user.click(screen.getByRole('button', { name: /export pattern to file/i }))
    expect(blobSpy).toHaveBeenCalledWith(
      ['note("d4").sound("piano")'],
      expect.anything(),
    )
  })

  it('import button triggers the hidden file input click', async () => {
    const inputClickSpy = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {})
    const user = userEvent.setup()
    render(<StrudelPane onAnalyserReady={noop} />)
    await user.click(screen.getByRole('button', { name: /import pattern from file/i }))
    expect(inputClickSpy).toHaveBeenCalled()
    inputClickSpy.mockRestore()
  })

  it('importing a file sets the title from the filename', async () => {
    render(<StrudelPane onAnalyserReady={noop} />)
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['note("e4").sound("piano")'], 'my-groove.strudel', { type: 'text/plain' })
    // Provide a real FileReader so onload fires
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } })
      // Wait for FileReader.onload (async)
      await new Promise(resolve => setTimeout(resolve, 50))
    })
    const input = screen.getByRole('textbox', { name: /strudel pattern title/i })
    expect(input).toHaveValue('my-groove')
  })

  it('importing a file calls setCode on the mirror with file content', async () => {
    render(<StrudelPane onAnalyserReady={noop} />)
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const code = 'note("g4 a4").sound("piano")'
    const file = new File([code], 'pattern.strudel', { type: 'text/plain' })
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } })
      await new Promise(resolve => setTimeout(resolve, 50))
    })
    expect(mockSetCode).toHaveBeenCalledWith(code)
  })

  it('play button calls mirror.evaluate()', async () => {
    const user = userEvent.setup()
    render(<StrudelPane onAnalyserReady={noop} />)
    await user.click(screen.getByRole('button', { name: /play strudel/i }))
    expect(mockEvaluate).toHaveBeenCalled()
  })

  it('stop button is disabled when not playing', () => {
    render(<StrudelPane onAnalyserReady={noop} />)
    expect(screen.getByRole('button', { name: /stop/i })).toBeDisabled()
  })

  // ---------------------------------------------------------------------------
  // localStorage persistence
  // ---------------------------------------------------------------------------

  it('saves title to localStorage when title changes', async () => {
    const user = userEvent.setup()
    render(<StrudelPane onAnalyserReady={noop} />)
    const input = screen.getByRole('textbox', { name: /strudel pattern title/i })
    await user.clear(input)
    await user.type(input, 'My Beat')
    expect(localStorage.getItem('shader-playground:strudel-title')).toBe('My Beat')
  })

  it('loads initial title from localStorage on mount', () => {
    localStorage.setItem('shader-playground:strudel-title', 'Saved Pattern')
    render(<StrudelPane onAnalyserReady={noop} />)
    expect(screen.getByRole('textbox', { name: /strudel pattern title/i })).toHaveValue('Saved Pattern')
  })

  it('saves code to localStorage when play button is clicked', async () => {
    mockMirror.code = 'note("e4").sound("sine")'
    const user = userEvent.setup()
    render(<StrudelPane onAnalyserReady={noop} />)
    await user.click(screen.getByRole('button', { name: /play strudel/i }))
    expect(localStorage.getItem('shader-playground:strudel-code')).toBe('note("e4").sound("sine")')
  })

  // ---------------------------------------------------------------------------
  // Examples tab
  // ---------------------------------------------------------------------------

  it('Examples tab is present', () => {
    render(<StrudelPane onAnalyserReady={noop} />)
    expect(screen.getByRole('tab', { name: /examples/i })).toBeInTheDocument()
  })

  it('clicking Examples tab hides the CodeMirror editor area', async () => {
    const user = userEvent.setup()
    render(<StrudelPane onAnalyserReady={noop} />)
    await user.click(screen.getByRole('tab', { name: /examples/i }))
    // The CodeMirror root box should have display:none when Examples tab is active
    const editorBox = document.querySelector('[style*="display: none"]')
    expect(editorBox).toBeTruthy()
  })

  it('handleLoadExample calls mirror.evaluate() to auto-play the pattern', async () => {
    const user = userEvent.setup()
    vi.spyOn(globalThis, 'fetch').mockImplementation((url: RequestInfo | URL) => {
      const key = String(url)
      if (key.includes('index.json')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([{ id: 'melodic-arp', title: 'Melodic Arp' }]) } as Response)
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ title: 'Melodic Arp', content: 'note("c3").sound("sawtooth")' }) } as Response)
    })
    render(<StrudelPane onAnalyserReady={noop} />)
    await user.click(screen.getByRole('tab', { name: /examples/i }))
    await waitFor(() => screen.getByText('Melodic Arp'))
    await user.click(screen.getByText('Melodic Arp'))
    await user.click(screen.getByRole('button', { name: /^load$/i }))
    await waitFor(() => expect(mockEvaluate).toHaveBeenCalled())
    vi.restoreAllMocks()
  })
})
