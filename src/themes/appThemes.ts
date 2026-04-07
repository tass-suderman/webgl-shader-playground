// ---------------------------------------------------------------------------
// Application colour themes
// ---------------------------------------------------------------------------
// Colours are exposed as CSS custom properties on :root so every component
// can reference them via `var(--pg-*)` without needing to pass props.
// ---------------------------------------------------------------------------

export interface AppTheme {
  name: string
  label: string
  vars: Record<string, string>
}

// Kanagawa-inspired palette (default) ----------------------------------------
export const KANAGAWA_THEME: AppTheme = {
  name: 'kanagawa',
  label: 'Kanagawa',
  vars: {
    '--pg-bg-app':        '#080F1D',
    '--pg-bg-panel':      '#111620',
    '--pg-bg-header':     '#1F1F28',
    '--pg-bg-button':     '#363646',
    '--pg-bg-card':       '#080F1D',
    '--pg-bg-disabled':   '#2A2A3767',
    '--pg-text-primary':  '#FFFFFF',
    '--pg-text-muted':    '#A4B9EF',
    '--pg-text-button':   '#A4B9EF',
    '--pg-text-hover':    '#1F1F28',
    '--pg-text-disabled': '#A4B9EF',
    '--pg-border-subtle': 'rgba(149,127,184,0.25)',
    '--pg-border-faint':  'rgba(149,127,184,0.12)',
    '--pg-border-default':'#957FB8',
    '--pg-border-hover':  '#7AA89F',
    '--pg-border-disabled':'#565575',
    '--pg-divider-default':'rgba(149,127,184,0.2)',
    '--pg-divider-hover': 'rgba(122,168,159,0.5)',
    '--pg-accent':        '#7AA89F',
    '--pg-bg-hover':      '#7AA89F',
  },
}

// Original dark palette -------------------------------------------------------
export const ORIGINAL_DARK_THEME: AppTheme = {
  name: 'original-dark',
  label: 'Dark',
  vars: {
    '--pg-bg-app':        '#1a1a2e',
    '--pg-bg-panel':      '#1e1e1e',
    '--pg-bg-header':     '#252526',
    '--pg-bg-button':     '#3c3c3c',
    '--pg-bg-card':       '#1e1e1e',
    '--pg-bg-disabled':   'rgba(60,60,60,0.4)',
    '--pg-text-primary':  'rgba(255,255,255,0.7)',
    '--pg-text-muted':    'rgba(255,255,255,0.35)',
    '--pg-text-button':   'rgba(255,255,255,0.7)',
    '--pg-text-hover':    '#ffffff',
    '--pg-text-disabled': 'rgba(255,255,255,0.35)',
    '--pg-border-subtle': 'rgba(255,255,255,0.1)',
    '--pg-border-faint':  'rgba(255,255,255,0.05)',
    '--pg-border-default':'rgba(255,255,255,0.2)',
    '--pg-border-hover':  'rgba(255,255,255,0.5)',
    '--pg-border-disabled':'rgba(255,255,255,0.15)',
    '--pg-divider-default':'rgba(255,255,255,0.15)',
    '--pg-divider-hover': 'rgba(255,255,255,0.35)',
    '--pg-accent':        'rgba(255,255,255,0.5)',
    '--pg-bg-hover':      'rgba(255,255,255,0.2)',
  },
}

export const ALL_THEMES: AppTheme[] = [KANAGAWA_THEME, ORIGINAL_DARK_THEME]

// ---------------------------------------------------------------------------
// Apply a theme by writing its vars to :root
// ---------------------------------------------------------------------------
export function applyTheme(theme: AppTheme): void {
  const root = document.documentElement
  for (const [prop, value] of Object.entries(theme.vars)) {
    root.style.setProperty(prop, value)
  }
}

export function getThemeByName(name: string): AppTheme {
  return ALL_THEMES.find(t => t.name === name) ?? KANAGAWA_THEME
}
