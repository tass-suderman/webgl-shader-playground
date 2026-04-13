// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import StrudelError from './StrudelError'

describe('StrudelError', () => {
  it('renders nothing when error is null', () => {
    const { container } = render(<StrudelError error={null} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when error is empty string (falsy)', () => {
    const { container } = render(<StrudelError error="" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders the error message when error is provided', () => {
    render(<StrudelError error="pattern evaluation error" />)
    expect(screen.getByText('pattern evaluation error')).toBeInTheDocument()
  })

  it('renders multi-line error messages', () => {
    render(<StrudelError error={'line 1\nline 2'} />)
    expect(screen.getByText(/line 1/)).toBeInTheDocument()
  })

  it('renders a dismiss button with accessible label when an error is shown', () => {
    render(<StrudelError error="some error" />)
    expect(screen.getByRole('button', { name: /dismiss error/i })).toBeInTheDocument()
  })

  it('hides the error panel when the dismiss button is clicked', async () => {
    const user = userEvent.setup()
    render(<StrudelError error="some error" />)
    await user.click(screen.getByRole('button', { name: /dismiss error/i }))
    expect(screen.queryByText('some error')).not.toBeInTheDocument()
  })

  it('re-shows the error when a new error arrives after dismissal', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<StrudelError error="first error" />)
    await user.click(screen.getByRole('button', { name: /dismiss error/i }))
    expect(screen.queryByText('first error')).not.toBeInTheDocument()
    rerender(<StrudelError error="second error" />)
    expect(screen.getByText('second error')).toBeInTheDocument()
  })
})
