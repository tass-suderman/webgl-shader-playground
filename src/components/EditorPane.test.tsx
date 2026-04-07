import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

// ---------------------------------------------------------------------------
// Mock Monaco editor – must be hoisted before the component import
// ---------------------------------------------------------------------------

const { mockSetValue } = vi.hoisted(() => ({
  mockSetValue: vi.fn(),
}))

vi.mock('@monaco-editor/react', () => ({
  default: ({ onChange, onMount, beforeMount }: {
    onChange?: (value: string | undefined) => void
    onMount?: (editor: unknown, monaco: unknown) => void
    beforeMount?: (monaco: unknown) => void
    defaultValue?: string
  }) => {
    // Simulate beforeMount + onMount in effect
    React.useEffect(() => {
      const mockedMonaco = {
        languages: {
          register: vi.fn(),
          setMonarchTokensProvider: vi.fn(),
          setLanguageConfiguration: vi.fn(),
        },
        editor: {
          defineTheme: vi.fn(),
          setTheme: vi.fn(),
        },
      }
      beforeMount?.(mockedMonaco)
      const mockEditor = { setValue: mockSetValue, getValue: () => 'void main() {}', onDidDispose: vi.fn() }
      onMount?.(mockEditor, mockedMonaco)
    }, [])
    return (
      <textarea
        data-testid="monaco-editor"
        onChange={e => onChange?.(e.target.value)}
      />
    )
  },
}))

// Mock monaco-vim to avoid requiring the full monaco-editor ESM build in tests
vi.mock('monaco-vim', () => ({
  initVimMode: vi.fn(() => ({ dispose: vi.fn() })),
}))

// ---------------------------------------------------------------------------
// Component under test (imported after mocks)
// ---------------------------------------------------------------------------
import EditorPane from './EditorPane'
import type { EditorPaneHandle } from './EditorPane'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let activeSpies: Array<{ mockRestore(): void }> = []

function mockDownload() {
  const appendSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => document.body as unknown as ReturnType<typeof document.body.appendChild>)
  activeSpies.push(appendSpy)
  vi.spyOn(document.body, 'removeChild').mockImplementation(() => document.body as unknown as ReturnType<typeof document.body.removeChild>)
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  vi.stubGlobal('URL', {
    createObjectURL: vi.fn(() => 'blob:fake-url'),
    revokeObjectURL: vi.fn(),
  })
  return { appendSpy }
}

function restoreDownload() {
  activeSpies.forEach(s => s.mockRestore())
  activeSpies = []
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
}

const DEFAULT_PROPS = {
  initialCode: 'void main() {}',
  onRun: vi.fn(),
  pendingSource: 'void main() {}',
  onCodeChange: vi.fn(),
  shaderError: null,
  vimMode: false,
  themeName: 'kanagawa',
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('EditorPane', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  afterEach(() => {
    restoreDownload()
  })

  it('renders with the default title', () => {
    render(<EditorPane {...DEFAULT_PROPS} />)
    const input = screen.getByRole('textbox', { name: /shader title/i })
    expect(input).toHaveValue('Fragment Shader (GLSL)')
  })

  it('title input is editable', async () => {
    const user = userEvent.setup()
    render(<EditorPane {...DEFAULT_PROPS} />)
    const input = screen.getByRole('textbox', { name: /shader title/i })
    await user.clear(input)
    await user.type(input, 'My Shader')
    expect(input).toHaveValue('My Shader')
  })

  it('Run Shader button calls onRun with the current pendingSource', async () => {
    const onRun = vi.fn()
    const user = userEvent.setup()
    render(<EditorPane {...DEFAULT_PROPS} onRun={onRun} pendingSource="float x = 1.0;" />)
    await user.click(screen.getByRole('button', { name: /run shader/i }))
    expect(onRun).toHaveBeenCalledWith('float x = 1.0;')
  })

  it('export button downloads file named after the current title', async () => {
    const user = userEvent.setup()
    render(<EditorPane {...DEFAULT_PROPS} />)
    const { appendSpy } = mockDownload()
    await user.click(screen.getByRole('button', { name: /export shader to file/i }))
    const anchor = appendSpy.mock.calls[0]?.[0] as HTMLAnchorElement | undefined
    expect(anchor).toBeDefined()
    expect(anchor!.download).toBe('Fragment Shader _GLSL.glsl')
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:fake-url')
  })

  it('export uses updated title when title has been changed', async () => {
    const user = userEvent.setup()
    render(<EditorPane {...DEFAULT_PROPS} />)
    const input = screen.getByRole('textbox', { name: /shader title/i })
    await user.clear(input)
    await user.type(input, 'My Effect')
    const { appendSpy } = mockDownload()
    await user.click(screen.getByRole('button', { name: /export shader to file/i }))
    const anchor = appendSpy.mock.calls[0]?.[0] as HTMLAnchorElement | undefined
    expect(anchor!.download).toBe('My Effect.glsl')
  })

  it('export sanitizes special characters in the title', async () => {
    const user = userEvent.setup()
    render(<EditorPane {...DEFAULT_PROPS} />)
    const input = screen.getByRole('textbox', { name: /shader title/i })
    await user.clear(input)
    await user.type(input, 'My/Shader:Test')
    const { appendSpy } = mockDownload()
    await user.click(screen.getByRole('button', { name: /export shader to file/i }))
    const anchor = appendSpy.mock.calls[0]?.[0] as HTMLAnchorElement | undefined
    expect(anchor!.download).not.toContain('/')
    expect(anchor!.download).not.toContain(':')
    expect(anchor!.download).toMatch(/\.glsl$/)
  })

  it('import button triggers hidden file input click', async () => {
    const inputClickSpy = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {})
    const user = userEvent.setup()
    render(<EditorPane {...DEFAULT_PROPS} />)
    await user.click(screen.getByRole('button', { name: /import shader from file/i }))
    expect(inputClickSpy).toHaveBeenCalled()
    inputClickSpy.mockRestore()
  })

  it('importing a file calls onCodeChange with the file content', async () => {
    const onCodeChange = vi.fn()
    render(<EditorPane {...DEFAULT_PROPS} onCodeChange={onCodeChange} />)
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const content = 'void main() { gl_FragColor = vec4(1.0); }'
    const file = new File([content], 'effect.glsl', { type: 'text/plain' })
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } })
      await new Promise(resolve => setTimeout(resolve, 50))
    })
    expect(onCodeChange).toHaveBeenCalledWith(content)
  })

  it('importing a file sets the title from the filename', async () => {
    render(<EditorPane {...DEFAULT_PROPS} />)
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['shader code'], 'ocean-waves.glsl', { type: 'text/plain' })
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } })
      await new Promise(resolve => setTimeout(resolve, 50))
    })
    const input = screen.getByRole('textbox', { name: /shader title/i })
    expect(input).toHaveValue('ocean-waves')
  })

  it('displays the shader error when shaderError prop is set', () => {
    render(<EditorPane {...DEFAULT_PROPS} shaderError="ERROR: syntax error on line 3" />)
    expect(screen.getByText(/syntax error on line 3/i)).toBeInTheDocument()
  })

  it('does not display an error panel when shaderError is null', () => {
    render(<EditorPane {...DEFAULT_PROPS} shaderError={null} />)
    expect(screen.queryByText(/error/i)).not.toBeInTheDocument()
  })

  // ---------------------------------------------------------------------------
  // localStorage persistence
  // ---------------------------------------------------------------------------

  it('saves code to localStorage when editor content changes', async () => {
    const user = userEvent.setup()
    render(<EditorPane {...DEFAULT_PROPS} />)
    const textarea = screen.getByTestId('monaco-editor')
    await user.clear(textarea)
    await user.type(textarea, 'float x = 2.0;')
    expect(localStorage.getItem('shader-playground:glsl-code')).toBe('float x = 2.0;')
  })

  it('saves title to localStorage when title changes', async () => {
    const user = userEvent.setup()
    render(<EditorPane {...DEFAULT_PROPS} />)
    const input = screen.getByRole('textbox', { name: /shader title/i })
    await user.clear(input)
    await user.type(input, 'My Shader')
    expect(localStorage.getItem('shader-playground:glsl-title')).toBe('My Shader')
  })

  it('loads initial title from localStorage on mount', () => {
    localStorage.setItem('shader-playground:glsl-title', 'Saved Shader')
    render(<EditorPane {...DEFAULT_PROPS} />)
    expect(screen.getByRole('textbox', { name: /shader title/i })).toHaveValue('Saved Shader')
  })

  // ---------------------------------------------------------------------------
  // loadExample imperative handle
  // ---------------------------------------------------------------------------

  it('loadExample handle calls onRun with the example content', async () => {
    const onRun = vi.fn()
    const ref = React.createRef<EditorPaneHandle>()
    render(<EditorPane {...DEFAULT_PROPS} onRun={onRun} ref={ref} />)
    await act(async () => {
      ref.current?.loadExample('My Example', 'void main(){}')
    })
    expect(onRun).toHaveBeenCalledWith('void main(){}')
  })

  it('loadExample handle updates the title', async () => {
    const ref = React.createRef<EditorPaneHandle>()
    render(<EditorPane {...DEFAULT_PROPS} ref={ref} />)
    await act(async () => {
      ref.current?.loadExample('New Example Title', 'void main(){}')
    })
    expect(screen.getByRole('textbox', { name: /shader title/i })).toHaveValue('New Example Title')
  })
})
