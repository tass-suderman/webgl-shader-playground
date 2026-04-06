import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import StrudelHeader from './StrudelHeader'

const DEFAULT_PROPS = {
  title: 'Strudel Pattern',
  isPlaying: false,
  onTitleChange: vi.fn(),
  onImport: vi.fn(),
  onExport: vi.fn(),
  onShowSounds: vi.fn(),
  onReset: vi.fn(),
  onPlay: vi.fn(),
  onStop: vi.fn(),
}

describe('StrudelHeader', () => {
  it('renders the title in the input', () => {
    render(<StrudelHeader {...DEFAULT_PROPS} title="My Pattern" />)
    expect(screen.getByRole('textbox', { name: /strudel pattern title/i })).toHaveValue('My Pattern')
  })

  it('calls onTitleChange when title is edited', async () => {
    const onTitleChange = vi.fn()
    const user = userEvent.setup()
    render(<StrudelHeader {...DEFAULT_PROPS} onTitleChange={onTitleChange} />)
    const input = screen.getByRole('textbox', { name: /strudel pattern title/i })
    await user.clear(input)
    await user.type(input, 'New Beat')
    expect(onTitleChange).toHaveBeenCalled()
  })

  it('calls onImport when import button is clicked', async () => {
    const onImport = vi.fn()
    const user = userEvent.setup()
    render(<StrudelHeader {...DEFAULT_PROPS} onImport={onImport} />)
    await user.click(screen.getByRole('button', { name: /import pattern from file/i }))
    expect(onImport).toHaveBeenCalledTimes(1)
  })

  it('calls onExport when export button is clicked', async () => {
    const onExport = vi.fn()
    const user = userEvent.setup()
    render(<StrudelHeader {...DEFAULT_PROPS} onExport={onExport} />)
    await user.click(screen.getByRole('button', { name: /export pattern to file/i }))
    expect(onExport).toHaveBeenCalledTimes(1)
  })

  it('calls onShowSounds when sounds button is clicked', async () => {
    const onShowSounds = vi.fn()
    const user = userEvent.setup()
    render(<StrudelHeader {...DEFAULT_PROPS} onShowSounds={onShowSounds} />)
    await user.click(screen.getByRole('button', { name: /available sounds/i }))
    expect(onShowSounds).toHaveBeenCalledTimes(1)
  })

  it('calls onReset when reset button is clicked', async () => {
    const onReset = vi.fn()
    const user = userEvent.setup()
    render(<StrudelHeader {...DEFAULT_PROPS} onReset={onReset} />)
    await user.click(screen.getByRole('button', { name: /reset to default pattern/i }))
    expect(onReset).toHaveBeenCalledTimes(1)
  })

  it('calls onPlay when Play Strudel is clicked', async () => {
    const onPlay = vi.fn()
    const user = userEvent.setup()
    render(<StrudelHeader {...DEFAULT_PROPS} onPlay={onPlay} />)
    await user.click(screen.getByRole('button', { name: /play strudel/i }))
    expect(onPlay).toHaveBeenCalledTimes(1)
  })

  it('Stop button is disabled when isPlaying=false', () => {
    render(<StrudelHeader {...DEFAULT_PROPS} isPlaying={false} />)
    expect(screen.getByRole('button', { name: /stop/i })).toBeDisabled()
  })

  it('Stop button is enabled when isPlaying=true', () => {
    render(<StrudelHeader {...DEFAULT_PROPS} isPlaying={true} />)
    expect(screen.getByRole('button', { name: /stop/i })).not.toBeDisabled()
  })

  it('calls onStop when Stop is clicked while playing', async () => {
    const onStop = vi.fn()
    const user = userEvent.setup()
    render(<StrudelHeader {...DEFAULT_PROPS} isPlaying={true} onStop={onStop} />)
    await user.click(screen.getByRole('button', { name: /stop/i }))
    expect(onStop).toHaveBeenCalledTimes(1)
  })
})
