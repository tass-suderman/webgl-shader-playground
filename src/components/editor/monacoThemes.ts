import type { BeforeMount } from '@monaco-editor/react'

export const MONACO_THEME_KANAGAWA = 'playground-kanagawa'
export const MONACO_THEME_DARK = 'playground-dark'

// Set to true once the custom themes have been registered (module-level, global)
let monacoThemesDefined = false

export function ensureMonacoThemes(monaco: Parameters<BeforeMount>[0]) {
  if (monacoThemesDefined) return
  monacoThemesDefined = true

  // Kanagawa-inspired theme
  monaco.editor.defineTheme(MONACO_THEME_KANAGAWA, {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: '', foreground: 'DCD7BA', background: '111620' },
      { token: 'comment', foreground: '727169', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'C8A2CA' },
      { token: 'keyword.type', foreground: '7FB4CA' },
      { token: 'storage.modifier', foreground: 'C8A2CA' },
      { token: 'support.function', foreground: '7AA89F' },
      { token: 'variable.language', foreground: 'E46876' },
      { token: 'number', foreground: 'D27E99' },
      { token: 'number.float', foreground: 'D27E99' },
      { token: 'number.hex', foreground: 'D27E99' },
      { token: 'string', foreground: '98BB6C' },
      { token: 'operator', foreground: 'C0A36E' },
    ],
    colors: {
      'editor.background': '#111620',
      'editor.foreground': '#DCD7BA',
      'editor.lineHighlightBackground': '#1F1F2880',
      'editor.selectionBackground': '#2D4F6780',
      'editor.inactiveSelectionBackground': '#2D4F6740',
      'editorCursor.foreground': '#C8A2CA',
      'editorLineNumber.foreground': '#727169',
      'editorLineNumber.activeForeground': '#DCD7BA',
      'editorGutter.background': '#111620',
      'editor.findMatchBackground': '#2D4F6780',
      'editor.findMatchHighlightBackground': '#2D4F6740',
      'editorWidget.background': '#1F1F28',
      'editorWidget.border': '#957FB8',
      'input.background': '#1F1F28',
      'input.foreground': '#DCD7BA',
      'scrollbarSlider.background': '#957FB840',
      'scrollbarSlider.hoverBackground': '#957FB870',
    },
  })

  // Original dark theme
  monaco.editor.defineTheme(MONACO_THEME_DARK, {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#1e1e1e',
      'editor.foreground': '#d4d4d4',
    },
  })
}

export function themeNameToMonaco(themeName: string): string {
  if (themeName === 'kanagawa') return MONACO_THEME_KANAGAWA
  return MONACO_THEME_DARK
}
