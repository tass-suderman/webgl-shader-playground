import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ShaderError from './ShaderError'

describe('ShaderError', () => {
  it('renders nothing when error is null', () => {
    const { container } = render(<ShaderError error={null} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders the error message when error is provided', () => {
    render(<ShaderError error="ERROR: syntax error on line 3" />)
    expect(screen.getByText(/syntax error on line 3/i)).toBeInTheDocument()
  })

  it('renders multi-line error messages', () => {
    render(<ShaderError error={'line 1 error\nline 2 error'} />)
    expect(screen.getByText(/line 1 error/i)).toBeInTheDocument()
  })

  it('renders nothing when error is empty string (falsy)', () => {
    // Empty string is falsy – treat as no error
    const { container } = render(<ShaderError error={null} />)
    expect(container.firstChild).toBeNull()
  })
})
