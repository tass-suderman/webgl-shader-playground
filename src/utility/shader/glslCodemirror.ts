// ---------------------------------------------------------------------------
// GLSL language support for CodeMirror 6
// – StreamLanguage tokenizer (syntax highlighting)
// – Completion source (autocomplete for keywords, builtins, and uniforms)
// ---------------------------------------------------------------------------

import { StreamLanguage } from '@codemirror/language'
import { tags } from '@lezer/highlight'
import type { CompletionContext, Completion } from '@codemirror/autocomplete'
import { UNIFORMS } from './uniformsData'

// ---------------------------------------------------------------------------
// Keyword / identifier sets (ported from the Monaco Monarch tokenizer)
// ---------------------------------------------------------------------------

const KEYWORDS = new Set([
  'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default',
  'return', 'break', 'continue', 'discard', 'struct', 'true', 'false',
])

const TYPE_KEYWORDS = new Set([
  'void', 'bool', 'int', 'uint', 'float', 'double',
  'vec2', 'vec3', 'vec4',
  'bvec2', 'bvec3', 'bvec4',
  'ivec2', 'ivec3', 'ivec4',
  'uvec2', 'uvec3', 'uvec4',
  'dvec2', 'dvec3', 'dvec4',
  'mat2', 'mat3', 'mat4',
  'mat2x2', 'mat2x3', 'mat2x4',
  'mat3x2', 'mat3x3', 'mat3x4',
  'mat4x2', 'mat4x3', 'mat4x4',
  'sampler2D', 'sampler3D', 'samplerCube',
  'sampler2DShadow', 'samplerCubeShadow',
  'sampler2DArray', 'sampler2DArrayShadow',
  'isampler2D', 'isampler3D', 'isamplerCube', 'isampler2DArray',
  'usampler2D', 'usampler3D', 'usamplerCube', 'usampler2DArray',
])

const QUALIFIERS = new Set([
  'uniform', 'attribute', 'varying', 'in', 'out', 'inout',
  'const', 'precision', 'highp', 'mediump', 'lowp', 'layout',
])

const BUILTIN_FUNCTIONS = new Set([
  'radians', 'degrees', 'sin', 'cos', 'tan', 'asin', 'acos', 'atan',
  'sinh', 'cosh', 'tanh', 'asinh', 'acosh', 'atanh',
  'pow', 'exp', 'log', 'exp2', 'log2', 'sqrt', 'inversesqrt',
  'abs', 'sign', 'floor', 'trunc', 'round', 'roundEven', 'ceil', 'fract',
  'mod', 'modf', 'min', 'max', 'clamp', 'mix', 'step', 'smoothstep',
  'isnan', 'isinf', 'floatBitsToInt', 'floatBitsToUint', 'intBitsToFloat', 'uintBitsToFloat',
  'length', 'distance', 'dot', 'cross', 'normalize', 'faceforward', 'reflect', 'refract',
  'matrixCompMult', 'outerProduct', 'transpose', 'determinant', 'inverse',
  'lessThan', 'lessThanEqual', 'greaterThan', 'greaterThanEqual', 'equal', 'notEqual',
  'any', 'all', 'not',
  'texture', 'textureProj', 'textureLod', 'textureOffset', 'texelFetch',
  'textureGrad', 'textureSize', 'textureProjOffset', 'textureProjLod', 'textureProjLodOffset',
  'texture2D', 'texture2DProj', 'texture2DLod', 'texture2DProjLod',
  'texture3D', 'textureCube', 'textureCubeLod',
  'dFdx', 'dFdy', 'fwidth', 'emit',
  'packSnorm2x16', 'unpackSnorm2x16', 'packUnorm2x16', 'unpackUnorm2x16',
  'packHalf2x16', 'unpackHalf2x16',
])

const BUILTIN_VARIABLES = new Set([
  'gl_Position', 'gl_PointSize', 'gl_ClipDistance',
  'gl_FragCoord', 'gl_FrontFacing', 'gl_FragDepth', 'gl_PointCoord',
  'gl_FragColor', 'gl_FragData',
  'gl_VertexID', 'gl_InstanceID',
  'gl_DepthRange',
])

// ---------------------------------------------------------------------------
// Stream parser state
// ---------------------------------------------------------------------------

interface GlslState {
  inBlockComment: boolean
}

// ---------------------------------------------------------------------------
// GLSL StreamLanguage definition
// ---------------------------------------------------------------------------

export const glslLanguage = StreamLanguage.define<GlslState>({
  name: 'glsl',

  startState: () => ({ inBlockComment: false }),

  token(stream, state) {
    // Continue an open block comment
    if (state.inBlockComment) {
      if (stream.match('*/')) {
        state.inBlockComment = false
        return 'blockComment'
      }
      stream.next()
      return 'blockComment'
    }

    // Whitespace
    if (stream.eatSpace()) return null

    // Line comment
    if (stream.match('//')) {
      stream.skipToEnd()
      return 'lineComment'
    }

    // Block comment open
    if (stream.match('/*')) {
      state.inBlockComment = true
      return 'blockComment'
    }

    // Preprocessor directive (#version, #define, …) – entire line
    if (stream.peek() === '#') {
      stream.skipToEnd()
      return 'preprocessor'
    }

    // Float literal: 1.0, .5, 1e-3, etc.
    if (stream.match(/\d*\.\d+([eEfF][-+]?\d+)?[fF]?/)) return 'number'
    // Hex literal
    if (stream.match(/0[xX][0-9a-fA-F]+[uU]?/)) return 'number'
    // Integer literal
    if (stream.match(/\d+[uU]?/)) return 'number'

    // Identifiers / keywords
    if (stream.match(/[a-zA-Z_]\w*/)) {
      const word = stream.current()
      if (TYPE_KEYWORDS.has(word)) return 'type'
      if (QUALIFIERS.has(word)) return 'qualifier'
      if (BUILTIN_FUNCTIONS.has(word)) return 'builtin'
      if (BUILTIN_VARIABLES.has(word)) return 'glvar'
      if (KEYWORDS.has(word)) return 'keyword'
      return null
    }

    // Brackets
    if (stream.match(/[{}()[\]]/)) return 'bracket'

    // Operators and punctuation
    if (stream.match(/[=><!~?:&|+\-*^%;,.]/)) return 'operator'

    stream.next()
    return null
  },

  copyState: (state) => ({ ...state }),

  languageData: {
    commentTokens: { line: '//', block: { open: '/*', close: '*/' } },
    closeBrackets: { brackets: ['{', '[', '('] },
  },

  // Map token type names returned by token() to @lezer/highlight Tag objects
  tokenTable: {
    blockComment: tags.blockComment,
    lineComment: tags.lineComment,
    preprocessor: tags.processingInstruction,
    keyword: tags.keyword,
    type: tags.typeName,
    qualifier: tags.modifier,
    builtin: tags.function(tags.name),
    glvar: tags.special(tags.variableName),
    number: tags.number,
    operator: tags.operator,
    bracket: tags.bracket,
    string: tags.string,
  },
})

// ---------------------------------------------------------------------------
// Autocompletion source
// ---------------------------------------------------------------------------

// Pre-build completion option arrays so they are not rebuilt on every keystroke
const _keywordOptions: Completion[] = [...KEYWORDS].map(kw => ({
  label: kw,
  type: 'keyword',
}))

const _typeOptions: Completion[] = [...TYPE_KEYWORDS].map(kw => ({
  label: kw,
  type: 'type',
  detail: 'type',
}))

const _qualifierOptions: Completion[] = [...QUALIFIERS].map(q => ({
  label: q,
  type: 'keyword',
  detail: 'qualifier',
}))

const _builtinFnOptions: Completion[] = [...BUILTIN_FUNCTIONS].map(fn => ({
  label: fn,
  type: 'function',
  detail: 'built-in',
}))

const _builtinVarOptions: Completion[] = [...BUILTIN_VARIABLES].map(v => ({
  label: v,
  type: 'variable',
  detail: 'built-in variable',
}))

const _uniformOptions: Completion[] = UNIFORMS.map(u => ({
  label: u.name,
  type: 'variable',
  detail: u.type,
  info: u.description,
}))

const ALL_COMPLETIONS: Completion[] = [
  ..._keywordOptions,
  ..._typeOptions,
  ..._qualifierOptions,
  ..._builtinFnOptions,
  ..._builtinVarOptions,
  ..._uniformOptions,
]

export function glslCompletions(context: CompletionContext) {
  const word = context.matchBefore(/[a-zA-Z_]\w*/)
  if (!word || (word.from === word.to && !context.explicit)) return null
  return { from: word.from, options: ALL_COMPLETIONS }
}
