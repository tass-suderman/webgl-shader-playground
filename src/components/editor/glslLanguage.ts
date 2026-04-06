// ---------------------------------------------------------------------------
// GLSL Monarch tokenizer – registered before the Monaco editor mounts
// ---------------------------------------------------------------------------
export const GLSL_MONARCH_TOKENS = {
  keywords: [
    'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default',
    'return', 'break', 'continue', 'discard', 'struct', 'true', 'false',
  ],
  typeKeywords: [
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
  ],
  qualifiers: [
    'uniform', 'attribute', 'varying', 'in', 'out', 'inout',
    'const', 'precision', 'highp', 'mediump', 'lowp', 'layout',
  ],
  builtinFunctions: [
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
  ],
  builtinVariables: [
    'gl_Position', 'gl_PointSize', 'gl_ClipDistance',
    'gl_FragCoord', 'gl_FrontFacing', 'gl_FragDepth', 'gl_PointCoord',
    'gl_FragColor', 'gl_FragData',
    'gl_VertexID', 'gl_InstanceID',
    'gl_DepthRange',
  ],
  symbols: /[=><!~?:&|+\-*\/^%]+/,
  tokenizer: {
    root: [
      // Preprocessor directives (entire line)
      [/#.*$/, 'keyword.control'],
      // Identifiers and keywords
      [/[a-zA-Z_]\w*/, {
        cases: {
          '@typeKeywords': 'keyword.type',
          '@qualifiers': 'storage.modifier',
          '@builtinFunctions': 'support.function',
          '@builtinVariables': 'variable.language',
          '@keywords': 'keyword',
          '@default': 'identifier',
        },
      }],
      { include: '@whitespace' },
      [/[{}()[\]]/, '@brackets'],
      [/@symbols/, 'operator'],
      // Floats
      [/\d*\.\d+([eEfF][\-+]?\d+)?[fF]?/, 'number.float'],
      // Hex
      [/0[xX][0-9a-fA-F]+[uU]?/, 'number.hex'],
      // Integers
      [/\d+[uU]?/, 'number'],
    ],
    whitespace: [
      [/[ \t\r\n]+/, 'white'],
      [/\/\*/, 'comment', '@block_comment'],
      [/\/\/.*$/, 'comment'],
    ],
    block_comment: [
      [/[^\/*]+/, 'comment'],
      [/\*\//, 'comment', '@pop'],
      [/[\/*]/, 'comment'],
    ],
  },
}

export const GLSL_LANGUAGE_CONFIG = {
  comments: {
    lineComment: '//',
    blockComment: ['/*', '*/'] as [string, string],
  },
  brackets: [
    ['{', '}'],
    ['[', ']'],
    ['(', ')'],
  ] as [string, string][],
  autoClosingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
  ],
  surroundingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
  ],
}
