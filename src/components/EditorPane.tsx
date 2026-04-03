import { useCallback, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import InputBase from '@mui/material/InputBase'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import Editor from '@monaco-editor/react'
import type { OnMount, BeforeMount } from '@monaco-editor/react'
import type { editor as MonacoEditorNS } from 'monaco-editor'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import FileUploadIcon from '@mui/icons-material/FileUpload'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import RestartAltIcon from '@mui/icons-material/RestartAlt'

// ---------------------------------------------------------------------------
// GLSL Monarch tokenizer – registered before the Monaco editor mounts
// ---------------------------------------------------------------------------
const GLSL_MONARCH_TOKENS = {
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

const GLSL_LANGUAGE_CONFIG = {
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
// ---------------------------------------------------------------------------

const LS_GLSL_CODE = 'shader-playground:glsl-code'
const LS_GLSL_TITLE = 'shader-playground:glsl-title'
const DEFAULT_SHADER_TITLE = 'Fragment Shader (GLSL)'

interface EditorPaneProps {
  initialCode: string
  onRun: (code: string) => void
  pendingSource: string
  onCodeChange: (code: string) => void
  shaderError: string | null
}

export default function EditorPane({ initialCode, onRun, pendingSource, onCodeChange, shaderError }: EditorPaneProps) {
  const [shaderTitle, setShaderTitle] = useState(
    () => localStorage.getItem(LS_GLSL_TITLE) ?? DEFAULT_SHADER_TITLE,
  )
  const editorRef = useRef<MonacoEditorNS.IStandaloneCodeEditor | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Keep a ref so Monaco keyboard shortcuts always call with latest pendingSource
  const pendingSourceRef = useRef(pendingSource)
  pendingSourceRef.current = pendingSource

  const handleRun = useCallback(() => {
    onRun(pendingSourceRef.current)
  }, [onRun])

  const handleBeforeMount = useCallback<BeforeMount>((monaco) => {
    monaco.languages.register({ id: 'glsl' })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    monaco.languages.setMonarchTokensProvider('glsl', GLSL_MONARCH_TOKENS as any)
    monaco.languages.setLanguageConfiguration('glsl', GLSL_LANGUAGE_CONFIG)
  }, [])

  const handleEditorMount = useCallback<OnMount>((editor) => {
    editorRef.current = editor
  }, [])

  // Monaco's onChange fires after its built-in debounce (~300 ms), so saving
  // directly here avoids extra debounce logic while keeping localStorage current.
  const handleEditorChange = useCallback((value: string | undefined) => {
    if (value !== undefined) {
      onCodeChange(value)
      localStorage.setItem(LS_GLSL_CODE, value)
    }
  }, [onCodeChange])

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setShaderTitle(e.target.value)
    localStorage.setItem(LS_GLSL_TITLE, e.target.value)
  }, [])

  const handleReset = useCallback(() => {
    editorRef.current?.setValue(initialCode)
    // setValue may or may not fire onChange – set explicitly to be safe
    onCodeChange(initialCode)
    localStorage.setItem(LS_GLSL_CODE, initialCode)
    setShaderTitle(DEFAULT_SHADER_TITLE)
    localStorage.setItem(LS_GLSL_TITLE, DEFAULT_SHADER_TITLE)
    onRun(initialCode)
  }, [initialCode, onCodeChange, onRun])

  const handleExport = useCallback(() => {
    const blob = new Blob([pendingSourceRef.current], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    // Sanitize title: replace invalid filename chars, collapse repeated underscores, trim edges
    const safeName = shaderTitle
      .replace(/[^\w\s.-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^[_\s]+|[_\s]+$/g, '')
      .trim() || 'shader'
    a.download = safeName + '.glsl'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [shaderTitle])

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      const content = evt.target?.result as string
      if (content !== undefined) {
        // Update the editor display
        editorRef.current?.setValue(content)
        // Update parent state (also triggered by Monaco onChange, but set directly for safety)
        onCodeChange(content)
        localStorage.setItem(LS_GLSL_CODE, content)
        // Set title from filename, stripping the extension
        const name = file.name.replace(/\.[^.]+$/, '')
        setShaderTitle(name)
        localStorage.setItem(LS_GLSL_TITLE, name)
      }
    }
    reader.readAsText(file)
    // Reset so the same file can be re-imported
    e.target.value = ''
  }, [onCodeChange])

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: '#1e1e1e',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1,
          bgcolor: '#252526',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          flexShrink: 0,
          gap: 1,
        }}
      >
        {/* Editable title */}
        <InputBase
          value={shaderTitle}
          onChange={handleTitleChange}
          inputProps={{ 'aria-label': 'Shader title' }}
          sx={{
            color: 'rgba(255,255,255,0.7)',
            fontFamily: 'monospace',
            fontSize: '0.875rem',
            flex: 1,
            minWidth: 0,
            '& input': {
              p: 0,
              cursor: 'text',
            },
          }}
        />

        {/* Import / Export / Reset buttons */}
        <Tooltip title="Import shader from file">
          <IconButton size="small" onClick={handleImportClick} aria-label="Import shader from file" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            <FileUploadIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Export shader to file">
          <IconButton size="small" onClick={handleExport} aria-label="Export shader to file" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            <FileDownloadIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Reset to default shader">
          <IconButton size="small" onClick={handleReset} aria-label="Reset to default shader" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            <RestartAltIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Button
          variant="contained"
          color="primary"
          size="small"
          startIcon={<PlayArrowIcon />}
          onClick={handleRun}
          sx={{ textTransform: 'none', flexShrink: 0 }}
        >
          Run Shader
        </Button>
      </Box>

      {/* Keyboard shortcut hint */}
      <Box sx={{ px: 2, py: 0.5, bgcolor: '#252526', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace' }}>
          Ctrl+Enter to run shader · Alt+Enter to play Strudel · Alt+. to pause
        </Typography>
      </Box>

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".glsl,.frag,.vert,.fs,.vs,.txt"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Error display */}
      {shaderError && (
        <Box
          sx={{
            px: 2,
            py: 1,
            bgcolor: '#5a0000',
            borderBottom: '1px solid #ff0000',
            flexShrink: 0,
          }}
        >
          <Typography
            variant="caption"
            sx={{ color: '#ff8080', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}
          >
            {shaderError}
          </Typography>
        </Box>
      )}

      {/* Monaco editor */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <Editor
          height="100%"
          defaultLanguage="glsl"
          defaultValue={initialCode}
          onChange={handleEditorChange}
          beforeMount={handleBeforeMount}
          onMount={handleEditorMount}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            automaticLayout: true,
          }}
        />
      </Box>
    </Box>
  )
}
