import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EditorHeader from './EditorHeader'

const DEFAULT_PROPS = {
  title: 'My Shader',
  onTitleChange: vi.fn(),
  onImport: vi.fn(),
  onExport: vi.fn(),
  onReset: vi.fn(),
  onRun: vi.fn(),
}

describe('EditorHeader', () => {
  it('renders the title value in the input', () => {
    render(<EditorHeader {...DEFAULT_PROPS} title="Fragment Shader" />)
    expect(screen.getByRole('textbox', { name: /editor title/i })).toHaveValue('Fragment Shader')
  })

  it('uses custom titleAriaLabel', () => {
    render(<EditorHeader {...DEFAULT_PROPS} titleAriaLabel="Shader title" />)
    expect(screen.getByRole('textbox', { name: /shader title/i })).toBeInTheDocument()
  })

  it('calls onTitleChange when the title input changes', async () => {
    const onTitleChange = vi.fn()
    const user = userEvent.setup()
    render(<EditorHeader {...DEFAULT_PROPS} onTitleChange={onTitleChange} />)
    const input = screen.getByRole('textbox')
    await user.clear(input)
    await user.type(input, 'New Title')
    expect(onTitleChange).toHaveBeenCalled()
  })

  it('calls onImport when import button is clicked', async () => {
    const onImport = vi.fn()
    const user = userEvent.setup()
    render(<EditorHeader {...DEFAULT_PROPS} onImport={onImport} importAriaLabel="Import shader from file" />)
    await user.click(screen.getByRole('button', { name: /import shader from file/i }))
    expect(onImport).toHaveBeenCalledTimes(1)
  })

  it('calls onExport when export button is clicked', async () => {
    const onExport = vi.fn()
    const user = userEvent.setup()
    render(<EditorHeader {...DEFAULT_PROPS} onExport={onExport} exportAriaLabel="Export shader to file" />)
    await user.click(screen.getByRole('button', { name: /export shader to file/i }))
    expect(onExport).toHaveBeenCalledTimes(1)
  })

  it('calls onReset when reset button is clicked', async () => {
    const onReset = vi.fn()
    const user = userEvent.setup()
    render(<EditorHeader {...DEFAULT_PROPS} onReset={onReset} resetAriaLabel="Reset to default shader" />)
    await user.click(screen.getByRole('button', { name: /reset to default shader/i }))
    expect(onReset).toHaveBeenCalledTimes(1)
  })

  it('calls onRun when the run button is clicked', async () => {
    const onRun = vi.fn()
    const user = userEvent.setup()
    render(<EditorHeader {...DEFAULT_PROPS} onRun={onRun} runLabel="Run Shader" />)
    await user.click(screen.getByRole('button', { name: /run shader/i }))
    expect(onRun).toHaveBeenCalledTimes(1)
  })

  it('renders default run label text', () => {
    render(<EditorHeader {...DEFAULT_PROPS} />)
    expect(screen.getByRole('button', { name: /run/i })).toBeInTheDocument()
  })

  it('renders custom runLabel', () => {
    render(<EditorHeader {...DEFAULT_PROPS} runLabel="Play Strudel" />)
    expect(screen.getByRole('button', { name: /play strudel/i })).toBeInTheDocument()
  })
})
