// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EditorHeader from './EditorHeader'

const DEFAULT_PROPS = {
  title: 'My Shader',
  onTitleChange: vi.fn(),
  onImport: vi.fn(),
  onExport: vi.fn(),
  onRun: vi.fn(),
}

describe('EditorHeader', () => {
  it('renders the title in the input', () => {
    render(<EditorHeader {...DEFAULT_PROPS} title="My Shader" />)
    const input = screen.getByDisplayValue('My Shader')
    expect(input).toBeInTheDocument()
  })

  it('renders the Run button with default label', () => {
    render(<EditorHeader {...DEFAULT_PROPS} />)
    expect(screen.getByRole('button', { name: /run/i })).toBeInTheDocument()
  })

  it('renders a custom run label', () => {
    render(<EditorHeader {...DEFAULT_PROPS} runLabel="Play Strudel" />)
    expect(screen.getByRole('button', { name: /play strudel/i })).toBeInTheDocument()
  })

  it('calls onRun when Run button is clicked', async () => {
    const onRun = vi.fn()
    const user = userEvent.setup()
    render(<EditorHeader {...DEFAULT_PROPS} onRun={onRun} />)
    await user.click(screen.getByRole('button', { name: /run/i }))
    expect(onRun).toHaveBeenCalledTimes(1)
  })

  it('calls onImport when import button is clicked', async () => {
    const onImport = vi.fn()
    const user = userEvent.setup()
    render(<EditorHeader {...DEFAULT_PROPS} onImport={onImport} />)
    await user.click(screen.getByRole('button', { name: /import from file/i }))
    expect(onImport).toHaveBeenCalledTimes(1)
  })

  it('calls onExport when export button is clicked', async () => {
    const onExport = vi.fn()
    const user = userEvent.setup()
    render(<EditorHeader {...DEFAULT_PROPS} onExport={onExport} />)
    await user.click(screen.getByRole('button', { name: /export to file/i }))
    expect(onExport).toHaveBeenCalledTimes(1)
  })

  it('does not render sounds button when onShowSounds is not provided', () => {
    render(<EditorHeader {...DEFAULT_PROPS} />)
    expect(screen.queryByRole('button', { name: /available sounds/i })).not.toBeInTheDocument()
  })

  it('renders sounds button when onShowSounds is provided', () => {
    render(<EditorHeader {...DEFAULT_PROPS} onShowSounds={vi.fn()} />)
    expect(screen.getByRole('button', { name: /available sounds/i })).toBeInTheDocument()
  })

  it('calls onShowSounds when sounds button is clicked', async () => {
    const onShowSounds = vi.fn()
    const user = userEvent.setup()
    render(<EditorHeader {...DEFAULT_PROPS} onShowSounds={onShowSounds} />)
    await user.click(screen.getByRole('button', { name: /available sounds/i }))
    expect(onShowSounds).toHaveBeenCalledTimes(1)
  })

  it('does not render uniforms button when onShowUniforms is not provided', () => {
    render(<EditorHeader {...DEFAULT_PROPS} />)
    expect(screen.queryByRole('button', { name: /available uniforms/i })).not.toBeInTheDocument()
  })

  it('renders uniforms button when onShowUniforms is provided', () => {
    render(<EditorHeader {...DEFAULT_PROPS} onShowUniforms={vi.fn()} />)
    expect(screen.getByRole('button', { name: /available uniforms/i })).toBeInTheDocument()
  })

  it('does not render Stop button when onStop is not provided', () => {
    render(<EditorHeader {...DEFAULT_PROPS} />)
    expect(screen.queryByRole('button', { name: /stop/i })).not.toBeInTheDocument()
  })

  it('renders Stop button when onStop is provided', () => {
    render(<EditorHeader {...DEFAULT_PROPS} onStop={vi.fn()} isPlaying={false} />)
    expect(screen.getByRole('button', { name: /stop/i })).toBeInTheDocument()
  })

  it('Stop button is disabled when isPlaying is false', () => {
    render(<EditorHeader {...DEFAULT_PROPS} onStop={vi.fn()} isPlaying={false} />)
    expect(screen.getByRole('button', { name: /stop/i })).toBeDisabled()
  })

  it('Stop button is enabled when isPlaying is true', () => {
    render(<EditorHeader {...DEFAULT_PROPS} onStop={vi.fn()} isPlaying={true} />)
    expect(screen.getByRole('button', { name: /stop/i })).not.toBeDisabled()
  })

  it('calls onTitleChange when title input changes', async () => {
    const onTitleChange = vi.fn()
    const user = userEvent.setup()
    render(<EditorHeader {...DEFAULT_PROPS} onTitleChange={onTitleChange} />)
    const input = screen.getByDisplayValue('My Shader')
    await user.type(input, '!')
    expect(onTitleChange).toHaveBeenCalled()
  })
})
