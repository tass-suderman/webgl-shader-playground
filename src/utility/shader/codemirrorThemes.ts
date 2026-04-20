// ---------------------------------------------------------------------------
// CodeMirror 6 themes for the GLSL editor
// – Ported from the Monaco defineTheme definitions in monacoThemes.ts
// ---------------------------------------------------------------------------

import { EditorView } from '@codemirror/view'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags } from '@lezer/highlight'
import type { Extension } from '@codemirror/state'

// ---------------------------------------------------------------------------
// Kanagawa theme
// ---------------------------------------------------------------------------

const kanagawaHighlight = HighlightStyle.define([
  { tag: tags.comment,                        color: '#727169', fontStyle: 'italic' },
  { tag: tags.lineComment,                    color: '#727169', fontStyle: 'italic' },
  { tag: tags.blockComment,                   color: '#727169', fontStyle: 'italic' },
  { tag: tags.keyword,                        color: '#C8A2CA' },
  { tag: tags.typeName,                       color: '#7FB4CA' },
  { tag: tags.modifier,                       color: '#C8A2CA' },
  { tag: tags.function(tags.name),            color: '#7AA89F' },
  { tag: tags.special(tags.variableName),     color: '#E46876' },
  { tag: tags.processingInstruction,          color: '#C8A2CA' },
  { tag: tags.number,                         color: '#D27E99' },
  { tag: tags.string,                         color: '#98BB6C' },
  { tag: tags.operator,                       color: '#C0A36E' },
  { tag: tags.bracket,                        color: '#DCD7BA' },
])

const kanagawaEditorTheme = EditorView.theme({
  '&': {
    backgroundColor: '#111620',
    color: '#DCD7BA',
    height: '100%',
  },
  '.cm-content': {
    caretColor: '#C8A2CA',
  },
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: '#C8A2CA',
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': {
    backgroundColor: '#2D4F6780',
  },
  '.cm-activeLine': {
    backgroundColor: '#1F1F2880',
  },
  '.cm-gutters': {
    backgroundColor: '#111620',
    color: '#727169',
    border: 'none',
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#1F1F2880',
    color: '#DCD7BA',
  },
  '.cm-scroller': {
    fontFamily: 'monospace',
    overflow: 'auto',
  },
  '.cm-tooltip': {
    backgroundColor: '#1F1F28',
    border: '1px solid #957FB8',
    color: '#DCD7BA',
  },
  '.cm-tooltip-autocomplete ul li[aria-selected]': {
    backgroundColor: '#2D4F6780',
    color: '#DCD7BA',
  },
  '.cm-tooltip.cm-tooltip-autocomplete > ul': {
    maxHeight: '15em',
  },
  '.cm-completionMatchedText': {
    textDecoration: 'none',
    fontWeight: 'bold',
    color: '#7AA89F',
  },
  '.cm-completionDetail': {
    color: '#7FB4CA',
    fontStyle: 'italic',
  },
  '.cm-panels': {
    backgroundColor: '#1F1F28',
    color: '#DCD7BA',
  },
  '.cm-searchMatch': {
    backgroundColor: '#2D4F6780',
    outline: '1px solid #957FB870',
  },
  '.cm-searchMatch.cm-searchMatch-selected': {
    backgroundColor: '#2D4F6780',
    outline: '1px solid #C8A2CA',
  },
}, { dark: true })

// ---------------------------------------------------------------------------
// Original dark (VS Code-style) theme
// ---------------------------------------------------------------------------

const darkHighlight = HighlightStyle.define([
  { tag: tags.comment,                        color: '#6a9955', fontStyle: 'italic' },
  { tag: tags.lineComment,                    color: '#6a9955', fontStyle: 'italic' },
  { tag: tags.blockComment,                   color: '#6a9955', fontStyle: 'italic' },
  { tag: tags.keyword,                        color: '#569cd6' },
  { tag: tags.typeName,                       color: '#4ec9b0' },
  { tag: tags.modifier,                       color: '#569cd6' },
  { tag: tags.function(tags.name),            color: '#dcdcaa' },
  { tag: tags.special(tags.variableName),     color: '#9cdcfe' },
  { tag: tags.processingInstruction,          color: '#c586c0' },
  { tag: tags.number,                         color: '#b5cea8' },
  { tag: tags.string,                         color: '#ce9178' },
  { tag: tags.operator,                       color: '#d4d4d4' },
  { tag: tags.bracket,                        color: '#d4d4d4' },
])

const darkEditorTheme = EditorView.theme({
  '&': {
    backgroundColor: '#1e1e1e',
    color: '#d4d4d4',
    height: '100%',
  },
  '.cm-content': {
    caretColor: '#d4d4d4',
  },
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: '#d4d4d4',
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': {
    backgroundColor: '#264f7880',
  },
  '.cm-activeLine': {
    backgroundColor: '#ffffff0f',
  },
  '.cm-gutters': {
    backgroundColor: '#1e1e1e',
    color: '#858585',
    border: 'none',
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#ffffff0f',
    color: '#c6c6c6',
  },
  '.cm-scroller': {
    fontFamily: 'monospace',
    overflow: 'auto',
  },
  '.cm-tooltip': {
    backgroundColor: '#252526',
    border: '1px solid #3c3c3c',
    color: '#d4d4d4',
  },
  '.cm-tooltip-autocomplete ul li[aria-selected]': {
    backgroundColor: '#04395e',
    color: '#d4d4d4',
  },
  '.cm-tooltip.cm-tooltip-autocomplete > ul': {
    maxHeight: '15em',
  },
  '.cm-completionMatchedText': {
    textDecoration: 'none',
    fontWeight: 'bold',
    color: '#dcdcaa',
  },
  '.cm-completionDetail': {
    color: '#4ec9b0',
    fontStyle: 'italic',
  },
  '.cm-panels': {
    backgroundColor: '#252526',
    color: '#d4d4d4',
  },
  '.cm-searchMatch': {
    backgroundColor: '#264f7880',
    outline: '1px solid #3c3c3c',
  },
  '.cm-searchMatch.cm-searchMatch-selected': {
    backgroundColor: '#264f7880',
    outline: '1px solid #569cd6',
  },
}, { dark: true })

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Returns the full CodeMirror theme extension for the given app theme name. */
export function getGlslThemeExtension(themeName: string): Extension {
  if (themeName === 'kanagawa') {
    return [kanagawaEditorTheme, syntaxHighlighting(kanagawaHighlight)]
  }
  return [darkEditorTheme, syntaxHighlighting(darkHighlight)]
}
