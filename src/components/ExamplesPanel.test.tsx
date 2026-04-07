import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ExamplesPanel from './ExamplesPanel'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockFetch(responses: Record<string, unknown>) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation((url: RequestInfo | URL) => {
    const key = String(url)
    const matched = Object.keys(responses).find(k => key.includes(k))
    if (matched) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(responses[matched]),
      } as Response)
    }
    return Promise.reject(new Error(`Unexpected fetch: ${key}`))
  })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ExamplesPanel', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    fetchSpy?.mockRestore()
  })

  it('renders the list of examples fetched from the index', async () => {
    fetchSpy = mockFetch({
      'index.json': [{ id: 'plasma', title: 'Plasma Effect' }],
    })
    render(<ExamplesPanel type="glsl" onLoad={vi.fn()} />)
    await waitFor(() => expect(screen.getByText('Plasma Effect')).toBeInTheDocument())
  })

  it('shows an error message when the index fetch fails', async () => {
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'))
    render(<ExamplesPanel type="glsl" onLoad={vi.fn()} />)
    await waitFor(() => expect(screen.getByText(/failed to load examples/i)).toBeInTheDocument())
  })

  it('shows "No examples found" when the index returns an empty array', async () => {
    fetchSpy = mockFetch({ 'index.json': [] })
    render(<ExamplesPanel type="strudel" onLoad={vi.fn()} />)
    await waitFor(() => expect(screen.getByText(/no examples found/i)).toBeInTheDocument())
  })

  it('opens a confirmation dialog when an example is clicked', async () => {
    const user = userEvent.setup()
    fetchSpy = mockFetch({
      'index.json': [{ id: 'plasma', title: 'Plasma Effect' }],
    })
    render(<ExamplesPanel type="glsl" onLoad={vi.fn()} />)
    await waitFor(() => screen.getByText('Plasma Effect'))
    await user.click(screen.getByText('Plasma Effect'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(/load example/i)).toBeInTheDocument()
  })

  it('calls onLoad with title and content when the user confirms', async () => {
    const onLoad = vi.fn()
    const user = userEvent.setup()
    fetchSpy = mockFetch({
      'index.json': [{ id: 'plasma', title: 'Plasma Effect' }],
      'plasma.json': { title: 'Plasma Effect', content: 'void main() { gl_FragColor = vec4(1.0); }' },
    })
    render(<ExamplesPanel type="glsl" onLoad={onLoad} />)
    await waitFor(() => screen.getByText('Plasma Effect'))
    await user.click(screen.getByText('Plasma Effect'))
    await user.click(screen.getByRole('button', { name: /^load$/i }))
    await waitFor(() => expect(onLoad).toHaveBeenCalledWith(
      'Plasma Effect',
      'void main() { gl_FragColor = vec4(1.0); }',
    ))
  })

  it('closes the dialog and does not call onLoad when the user cancels', async () => {
    const onLoad = vi.fn()
    const user = userEvent.setup()
    fetchSpy = mockFetch({
      'index.json': [{ id: 'plasma', title: 'Plasma Effect' }],
    })
    render(<ExamplesPanel type="glsl" onLoad={onLoad} />)
    await waitFor(() => screen.getByText('Plasma Effect'))
    await user.click(screen.getByText('Plasma Effect'))
    // Dialog is open
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /cancel/i }))
    // Dialog should be gone (MUI unmounts it after close animation in tests)
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(onLoad).not.toHaveBeenCalled()
  })

  it('shows an error message when the example file fetch fails', async () => {
    const user = userEvent.setup()
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation((url: RequestInfo | URL) => {
      const key = String(url)
      if (key.includes('index.json')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{ id: 'plasma', title: 'Plasma Effect' }]),
        } as Response)
      }
      return Promise.reject(new Error('Network error'))
    })
    render(<ExamplesPanel type="glsl" onLoad={vi.fn()} />)
    await waitFor(() => screen.getByText('Plasma Effect'))
    await user.click(screen.getByText('Plasma Effect'))
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /^load$/i }))
    })
    await waitFor(() => expect(screen.getByText(/failed to load example/i)).toBeInTheDocument())
  })
})
