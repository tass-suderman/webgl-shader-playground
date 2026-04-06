import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SoundsModal from './SoundsModal'

describe('SoundsModal', () => {
  it('is not visible when open=false', () => {
    render(<SoundsModal open={false} onClose={vi.fn()} />)
    expect(screen.queryByText(/available sounds/i)).not.toBeInTheDocument()
  })

  it('is visible when open=true', () => {
    render(<SoundsModal open={true} onClose={vi.fn()} />)
    expect(screen.getByText(/available sounds/i)).toBeInTheDocument()
  })

  it('renders all sound categories', () => {
    render(<SoundsModal open={true} onClose={vi.fn()} />)
    expect(screen.getByText(/oscillator waveforms/i)).toBeInTheDocument()
    expect(screen.getByText(/synth voices/i)).toBeInTheDocument()
    expect(screen.getByText('Noise')).toBeInTheDocument()
    expect(screen.getByText(/zzfx \(procedural\)/i)).toBeInTheDocument()
  })

  it('renders individual sound names', () => {
    render(<SoundsModal open={true} onClose={vi.fn()} />)
    expect(screen.getByText('sine')).toBeInTheDocument()
    expect(screen.getByText('sawtooth')).toBeInTheDocument()
    expect(screen.getByText('pink')).toBeInTheDocument()
  })

  it('renders aliases for oscillator waveforms', () => {
    render(<SoundsModal open={true} onClose={vi.fn()} />)
    expect(screen.getByText(/sin → sine/i)).toBeInTheDocument()
  })

  it('calls onClose when the close button is clicked', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<SoundsModal open={true} onClose={onClose} />)
    await user.click(screen.getByRole('button', { name: /close sounds dialog/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
