import { useCallback, useEffect, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import InputBase from '@mui/material/InputBase'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import Editor from '@monaco-editor/react'
import type { OnMount, BeforeMount } from '@monaco-editor/react'
import type { editor as MonacoEditorNS } from 'monaco-editor'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import FileUploadIcon from '@mui/icons-material/FileUpload'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import { initVimMode, type VimAdapterInstance } from 'monaco-vim'
import ExamplesPanel from './ExamplesPanel'

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

// ---------------------------------------------------------------------------
// Monaco theme names exposed to the editor
// ---------------------------------------------------------------------------
const MONACO_THEME_KANAGAWA = 'playground-kanagawa'
const MONACO_THEME_DARK = 'playground-dark'
// Set to true once the custom themes have been registered (module-level, global)
let monacoThemesDefined = false

function ensureMonacoThemes(monaco: Parameters<BeforeMount>[0]) {
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

function themeNameToMonaco(themeName: string): string {
  if (themeName === 'kanagawa') return MONACO_THEME_KANAGAWA
  return MONACO_THEME_DARK
}

interface EditorPaneProps {
  initialCode: string
  onRun: (code: string) => void
  pendingSource: string
  onCodeChange: (code: string) => void
  shaderError: string | null
  vimMode: boolean
  themeName: string
}

export default function EditorPane({ initialCode, onRun, pendingSource, onCodeChange, shaderError, vimMode, themeName }: EditorPaneProps) {
  const [shaderTitle, setShaderTitle] = useState(
    () => localStorage.getItem(LS_GLSL_TITLE) ?? DEFAULT_SHADER_TITLE,
  )
  const [activeTab, setActiveTab] = useState<'editor' | 'examples'>('editor')
  const editorRef = useRef<MonacoEditorNS.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<Parameters<BeforeMount>[0] | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const statusBarRef = useRef<HTMLDivElement>(null)
  const vimModeInstanceRef = useRef<VimAdapterInstance | null>(null)

  // Keep a ref so Monaco keyboard shortcuts always call with latest pendingSource
  const pendingSourceRef = useRef(pendingSource)
  pendingSourceRef.current = pendingSource

  // Enable / disable vim mode whenever the prop changes or the editor mounts
  useEffect(() => {
    const editor = editorRef.current
    const statusBar = statusBarRef.current
    if (!editor || !statusBar) return

    if (vimMode) {
      if (!vimModeInstanceRef.current) {
        vimModeInstanceRef.current = initVimMode(editor, statusBar)
      }
    } else {
      if (vimModeInstanceRef.current) {
        vimModeInstanceRef.current.dispose()
        vimModeInstanceRef.current = null
        statusBar.textContent = ''
      }
    }
  }, [vimMode])

  const handleRun = useCallback(() => {
    onRun(pendingSourceRef.current)
  }, [onRun])

  const handleBeforeMount = useCallback<BeforeMount>((monaco) => {
    monacoRef.current = monaco
    monaco.languages.register({ id: 'glsl' })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    monaco.languages.setMonarchTokensProvider('glsl', GLSL_MONARCH_TOKENS as any)
    monaco.languages.setLanguageConfiguration('glsl', GLSL_LANGUAGE_CONFIG)
    ensureMonacoThemes(monaco)
  }, [])

  // Switch Monaco editor theme whenever the app theme changes
  useEffect(() => {
    monacoRef.current?.editor.setTheme(themeNameToMonaco(themeName))
  }, [themeName])

  const handleEditorMount = useCallback<OnMount>((editor) => {
    editorRef.current = editor
    // Initialize vim mode immediately if it is already enabled when the editor mounts
    if (vimMode && statusBarRef.current && !vimModeInstanceRef.current) {
      vimModeInstanceRef.current = initVimMode(editor, statusBarRef.current)
    }
    // Clean up vim mode when the editor is destroyed
    editor.onDidDispose(() => {
      if (vimModeInstanceRef.current) {
        vimModeInstanceRef.current.dispose()
        vimModeInstanceRef.current = null
      }
    })
  }, [vimMode])

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

  const handleLoadExample = useCallback((title: string, content: string) => {
    editorRef.current?.setValue(content)
    onCodeChange(content)
    localStorage.setItem(LS_GLSL_CODE, content)
    setShaderTitle(title)
    localStorage.setItem(LS_GLSL_TITLE, title)
    onRun(content)
    setActiveTab('editor')
  }, [onCodeChange, onRun])

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
        bgcolor: 'var(--pg-bg-panel)',
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
          bgcolor: 'var(--pg-bg-header)',
          borderBottom: '1px solid var(--pg-border-subtle)',
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
            color: 'var(--pg-text-primary)',
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
          <IconButton size="small" onClick={handleImportClick} aria-label="Import shader from file" sx={{ color: 'var(--pg-text-primary)' }}>
            <FileUploadIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Export shader to file">
          <IconButton size="small" onClick={handleExport} aria-label="Export shader to file" sx={{ color: 'var(--pg-text-primary)' }}>
            <FileDownloadIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Reset to default shader">
          <IconButton size="small" onClick={handleReset} aria-label="Reset to default shader" sx={{ color: 'var(--pg-text-primary)' }}>
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
      <Box sx={{ px: 2, py: 0.5, bgcolor: 'var(--pg-bg-header)', borderBottom: '1px solid var(--pg-border-faint)', flexShrink: 0 }}>
        <Typography variant="caption" sx={{ color: 'var(--pg-text-muted)', fontFamily: 'monospace' }}>
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

      {/* Editor / Examples tab bar */}
      <Tabs
        value={activeTab}
        onChange={(_e, val: 'editor' | 'examples') => setActiveTab(val)}
        sx={{
          minHeight: 32,
          flexShrink: 0,
          bgcolor: '#252526',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          '& .MuiTabs-indicator': { height: 2 },
        }}
      >
        <Tab
          label="Editor"
          value="editor"
          sx={{ minHeight: 32, py: 0.5, px: 2, fontSize: '0.75rem', textTransform: 'none', color: 'rgba(255,255,255,0.6)' }}
        />
        <Tab
          label="Examples"
          value="examples"
          sx={{ minHeight: 32, py: 0.5, px: 2, fontSize: '0.75rem', textTransform: 'none', color: 'rgba(255,255,255,0.6)' }}
        />
      </Tabs>

      {/* Monaco editor */}
      <Box sx={{ flex: 1, overflow: 'hidden', display: activeTab === 'editor' ? 'block' : 'none' }}>
        <Editor
          height="100%"
          defaultLanguage="glsl"
          defaultValue={initialCode}
          onChange={handleEditorChange}
          beforeMount={handleBeforeMount}
          onMount={handleEditorMount}
          theme={themeNameToMonaco(themeName)}
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

      {/* Examples panel */}
      {activeTab === 'examples' && (
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <ExamplesPanel type="glsl" onLoad={handleLoadExample} />
        </Box>
      )}

      {/* Vim status bar – only shown when vim mode is active */}
      <Box
        ref={statusBarRef}
        component="div"
        sx={{
          display: vimMode ? 'block' : 'none',
          px: 1,
          py: 0.25,
          bgcolor: 'var(--pg-bg-header)',
          color: 'var(--pg-text-primary)',
          fontFamily: 'monospace',
          fontSize: '0.8rem',
          borderTop: '1px solid var(--pg-border-subtle)',
          flexShrink: 0,
          minHeight: '1.5rem',
        }}
      />
    </Box>
  )
}
