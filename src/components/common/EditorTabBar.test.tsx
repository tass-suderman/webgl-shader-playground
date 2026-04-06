import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EditorTabBar from './EditorTabBar'

describe('EditorTabBar', () => {
  it('renders Editor and Examples tabs', () => {
    render(<EditorTabBar value="editor" onChange={vi.fn()} />)
    expect(screen.getByRole('tab', { name: /editor/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /examples/i })).toBeInTheDocument()
  })

  it('marks the active tab as selected', () => {
    render(<EditorTabBar value="editor" onChange={vi.fn()} />)
    expect(screen.getByRole('tab', { name: /editor/i })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: /examples/i })).toHaveAttribute('aria-selected', 'false')
  })

  it('marks Examples tab as selected when value is "examples"', () => {
    render(<EditorTabBar value="examples" onChange={vi.fn()} />)
    expect(screen.getByRole('tab', { name: /examples/i })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: /editor/i })).toHaveAttribute('aria-selected', 'false')
  })

  it('calls onChange with "examples" when Examples tab is clicked', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<EditorTabBar value="editor" onChange={onChange} />)
    await user.click(screen.getByRole('tab', { name: /examples/i }))
    expect(onChange).toHaveBeenCalledWith('examples')
  })

  it('calls onChange with "editor" when Editor tab is clicked', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<EditorTabBar value="examples" onChange={onChange} />)
    await user.click(screen.getByRole('tab', { name: /editor/i }))
    expect(onChange).toHaveBeenCalledWith('editor')
  })
})
