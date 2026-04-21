// ---------------------------------------------------------------------------
// GLSL language support for CodeMirror 6
// – LRLanguage from lezer-glsl (syntax highlighting)
// – Completion source (autocomplete for keywords, builtins, and uniforms)
// ---------------------------------------------------------------------------

import { LRLanguage } from '@codemirror/language'
import { parser } from 'lezer-glsl'
import type { CompletionContext, Completion } from '@codemirror/autocomplete'
import { UNIFORMS } from './uniformsData'

// ---------------------------------------------------------------------------
// GLSL LRLanguage definition (uses lezer-glsl parser with built-in styleTags)
// ---------------------------------------------------------------------------

export const glslLanguage = LRLanguage.define({
  name: 'glsl',
  parser,
  languageData: {
    commentTokens: { line: '//', block: { open: '/*', close: '*/' } },
    closeBrackets: { brackets: ['{', '[', '('] },
  },
})

// ---------------------------------------------------------------------------
// Keyword / identifier sets used for autocompletion
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
