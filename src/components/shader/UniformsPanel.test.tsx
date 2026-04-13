// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import UniformsPanel from './UniformsPanel'

describe('UniformsPanel', () => {
  it('renders the iTime uniform', () => {
    render(<UniformsPanel />)
    expect(screen.getByText('iTime')).toBeInTheDocument()
  })

  it('renders the iResolution uniform', () => {
    render(<UniformsPanel />)
    expect(screen.getByText('iResolution')).toBeInTheDocument()
  })

  it('renders the iMouse uniform', () => {
    render(<UniformsPanel />)
    expect(screen.getByText('iMouse')).toBeInTheDocument()
  })

  it('renders the iChannel0 uniform', () => {
    render(<UniformsPanel />)
    expect(screen.getByText('iChannel0')).toBeInTheDocument()
  })

  it('renders the ShaderToy compatibility note', () => {
    render(<UniformsPanel />)
    expect(screen.getByText(/ShaderToy/i)).toBeInTheDocument()
  })
})
