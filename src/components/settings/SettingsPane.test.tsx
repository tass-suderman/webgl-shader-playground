// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SettingsPane from './SettingsPane'

const DEFAULT_PROPS = {
  vimMode: false,
  onVimModeChange: vi.fn(),
  themeName: 'kanagawa',
  onThemeChange: vi.fn(),
  fontSize: 13,
  onFontSizeChange: vi.fn(),
}

describe('SettingsPane', () => {
  it('renders Settings heading', () => {
    render(<SettingsPane {...DEFAULT_PROPS} />)
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('renders vim keybindings checkbox unchecked when vimMode is false', () => {
    render(<SettingsPane {...DEFAULT_PROPS} vimMode={false} />)
    const checkbox = screen.getByRole('checkbox', { name: /vim keybindings/i })
    expect(checkbox).not.toBeChecked()
  })

  it('renders vim keybindings checkbox checked when vimMode is true', () => {
    render(<SettingsPane {...DEFAULT_PROPS} vimMode={true} />)
    const checkbox = screen.getByRole('checkbox', { name: /vim keybindings/i })
    expect(checkbox).toBeChecked()
  })

  it('calls onVimModeChange when the vim checkbox is toggled', async () => {
    const onVimModeChange = vi.fn()
    const user = userEvent.setup()
    render(<SettingsPane {...DEFAULT_PROPS} onVimModeChange={onVimModeChange} />)
    const checkbox = screen.getByRole('checkbox', { name: /vim keybindings/i })
    await user.click(checkbox)
    expect(onVimModeChange).toHaveBeenCalledWith(true)
  })

  it('renders Reset data button', () => {
    render(<SettingsPane {...DEFAULT_PROPS} />)
    expect(screen.getByRole('button', { name: /reset data/i })).toBeInTheDocument()
  })

  it('opens reset confirmation dialog when Reset data is clicked', async () => {
    const user = userEvent.setup()
    render(<SettingsPane {...DEFAULT_PROPS} />)
    await user.click(screen.getByRole('button', { name: /reset data/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(/Reset all data\?/i)).toBeInTheDocument()
  })

  it('closes reset dialog when Cancel is clicked', async () => {
    const user = userEvent.setup()
    render(<SettingsPane {...DEFAULT_PROPS} />)
    await user.click(screen.getByRole('button', { name: /reset data/i }))
    expect(screen.getByText(/Reset all data\?/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /cancel/i }))
    await waitFor(() => {
      expect(screen.queryByText(/Reset all data\?/i)).not.toBeInTheDocument()
    })
  })

  it('renders keyboard shortcuts section', () => {
    render(<SettingsPane {...DEFAULT_PROPS} />)
    expect(screen.getByText(/Keyboard Shortcuts/i)).toBeInTheDocument()
    expect(screen.getByText(/Ctrl \+ Enter/i)).toBeInTheDocument()
    expect(screen.getByText(/Alt \+ Enter/i)).toBeInTheDocument()
  })

  it('renders the theme selector with the current theme selected', () => {
    render(<SettingsPane {...DEFAULT_PROPS} themeName="kanagawa" />)
    const comboboxes = screen.getAllByRole('combobox')
    expect(comboboxes.length).toBeGreaterThanOrEqual(1)
    // The theme combobox shows the theme label
    const themeCombobox = comboboxes.find(el => el.textContent?.includes('Kanagawa'))
    expect(themeCombobox).toBeDefined()
  })
})
