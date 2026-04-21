// ---------------------------------------------------------------------------
// CodeMirror 6 theme for the GLSL editor
// ---------------------------------------------------------------------------

import { EditorView } from '@codemirror/view'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags } from '@lezer/highlight'
import type { Extension } from '@codemirror/state'

// ---------------------------------------------------------------------------
// Kanagawa theme
// ---------------------------------------------------------------------------

const kanagawaHighlight = HighlightStyle.define([
  { tag: tags.comment,                                      color: '#727169', fontStyle: 'italic' },
  { tag: tags.lineComment,                                  color: '#727169', fontStyle: 'italic' },
  { tag: tags.blockComment,                                 color: '#727169', fontStyle: 'italic' },
  { tag: tags.keyword,                                      color: '#C8A2CA' },
  { tag: tags.controlKeyword,                               color: '#C8A2CA' },
  { tag: tags.definitionKeyword,                            color: '#C8A2CA' },
  { tag: tags.typeName,                                     color: '#7FB4CA' },
  { tag: tags.standard(tags.typeName),                      color: '#7FB4CA' },
  { tag: tags.modifier,                                     color: '#C8A2CA' },
  { tag: tags.function(tags.variableName),                  color: '#7AA89F' },
  { tag: tags.function(tags.propertyName),                  color: '#7AA89F' },
  { tag: tags.function(tags.definition(tags.variableName)), color: '#7AA89F' },
  { tag: tags.processingInstruction,                        color: '#C8A2CA' },
  { tag: tags.meta,                                         color: '#C8A2CA' },
  { tag: tags.number,                                       color: '#D27E99' },
  { tag: tags.bool,                                         color: '#D27E99' },
  { tag: tags.string,                                       color: '#98BB6C' },
  { tag: tags.operator,                                     color: '#C0A36E' },
  { tag: tags.arithmeticOperator,                           color: '#C0A36E' },
  { tag: tags.logicOperator,                                color: '#C0A36E' },
  { tag: tags.bitwiseOperator,                              color: '#C0A36E' },
  { tag: tags.compareOperator,                              color: '#C0A36E' },
  { tag: tags.definitionOperator,                           color: '#C0A36E' },
  { tag: tags.updateOperator,                               color: '#C0A36E' },
  { tag: tags.brace,                                        color: '#DCD7BA' },
  { tag: tags.squareBracket,                                color: '#DCD7BA' },
  { tag: tags.bracket,                                      color: '#DCD7BA' },
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
// Public API
// ---------------------------------------------------------------------------

/** Returns the full CodeMirror theme extension for the GLSL editor. */
export function getGlslThemeExtension(): Extension {
  return [kanagawaEditorTheme, syntaxHighlighting(kanagawaHighlight)]
}
