// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import SoundsPanel from './SoundsPanel'

describe('SoundsPanel', () => {
  it('renders oscillator waveforms section', () => {
    render(<SoundsPanel />)
    expect(screen.getByText(/oscillator waveforms/i)).toBeInTheDocument()
  })

  it('renders sine as a sound option', () => {
    render(<SoundsPanel />)
    expect(screen.getByText('sine')).toBeInTheDocument()
  })

  it('renders TR-909 drums section', () => {
    render(<SoundsPanel />)
    expect(screen.getByText(/TR-909 drums/i)).toBeInTheDocument()
  })

  it('renders bd909 as a drum sound', () => {
    render(<SoundsPanel />)
    expect(screen.getByText('bd909')).toBeInTheDocument()
  })

  it('renders the .sound() usage hint', () => {
    render(<SoundsPanel />)
    expect(screen.getByText(/\.sound\("name"\)/)).toBeInTheDocument()
  })

  it('renders aliases for oscillator waveforms', () => {
    render(<SoundsPanel />)
    expect(screen.getByText(/sin → sine/)).toBeInTheDocument()
  })
})
