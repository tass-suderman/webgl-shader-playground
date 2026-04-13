// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import AboutPane from './AboutPane'

describe('AboutPane', () => {
  it('renders the app name', () => {
    render(<AboutPane />)
    expect(screen.getByText(/About Shades/i)).toBeInTheDocument()
  })

  it('renders the license section', () => {
    render(<AboutPane />)
    expect(screen.getByText('License')).toBeInTheDocument()
  })

  it('renders a link to the Strudel project', () => {
    render(<AboutPane />)
    const links = screen.getAllByRole('link', { name: /strudel/i })
    expect(links.length).toBeGreaterThan(0)
    expect(links[0]).toHaveAttribute('href', 'https://strudel.cc')
  })

  it('renders a link to the GitHub repository', () => {
    render(<AboutPane />)
    const githubLink = screen.getByRole('link', { name: /github/i })
    expect(githubLink).toHaveAttribute('href', 'https://github.com/tass-suderman/shades-and-waves')
  })

  it('renders the Sound Banks section', () => {
    render(<AboutPane />)
    expect(screen.getByText(/Sound Banks/i)).toBeInTheDocument()
  })

  it('renders Dirt-Samples attribution link', () => {
    render(<AboutPane />)
    const link = screen.getByRole('link', { name: /Dirt-Samples/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', 'https://github.com/tidalcycles/Dirt-Samples')
  })

  it('all external links open in a new tab with noopener', () => {
    render(<AboutPane />)
    const links = screen.getAllByRole('link')
    links.forEach(link => {
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })
  })
})
