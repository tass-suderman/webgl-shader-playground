import { alpha, Box, createTheme, ThemeProvider } from '@mui/material'
import ShaderPane from '../ShaderPane/ShaderPane'
import ShaderControls from '../ShaderControls/ShaderControls'
import { type ShaderPaneHandle } from '../ShaderPane/ShaderPane'
import { type StrudelPaneHandle } from '../StrudelPane/StrudelPane'
import { type EditorPaneHandle } from '../EditorPane/EditorPane'
import { EditorContent } from '../EditorContent/EditorContent'
import { OverwriteDialog } from '../OverwriteDialog/OverwriteDialog'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useAppStorage } from '../../hooks/useAppStorage'
import { useTheme } from '../../hooks/useTheme'
import { ImmersiveTopBar } from '../ImmersiveTopBar/ImmersiveTopBar'
import { useViewState } from '../../hooks/useViewState'

export const ImmersiveView = () => {
const strudelRef = useRef<StrudelPaneHandle>(null)
const shaderRef = useRef<ShaderPaneHandle>(null)
const editorRef = useRef<EditorPaneHandle>(null)

const {
viewMode, setViewMode,
shaderSource, setShaderSource,
shaderError, setShaderError,
overwriteDialogOpen,
dontShowAgain, setDontShowAgain,
overwritePending, setOverwritePending,
setOverwriteDialogOpen,
outerContainerRef,
commitSave,
handleOverwriteCancel,
handleOverwriteConfirm,
} = useViewState()

  const [immersiveShaderPlaying, setImmersiveShaderPlaying] = useState(true)
  const [immersiveShaderRecording, setImmersiveShaderRecording] = useState(false)
  const [immersiveShaderFullscreen, setImmersiveShaderFullscreen] = useState(false)

const { immersiveOpacity } = useAppStorage()
const { muiTheme } = useTheme()

  // Build a theme variant with alpha-blended backgrounds so every component
  // inside the overlay respects the immersive opacity slider automatically.
  const immersiveTheme = useMemo(() => {
    const a = immersiveOpacity / 100
    const bg = muiTheme.palette.background
    return createTheme(muiTheme, {
      palette: {
        background: {
          app:      alpha(bg.app,      a),
          panel:    alpha(bg.panel,    a),
          header:   alpha(bg.header,   a),
          button:   alpha(bg.button,   a),
          card:     alpha(bg.card,     a),
          disabled: alpha(bg.disabled, a),
          hover:    alpha(bg.hover,    a),
        },
      },
    })
  }, [muiTheme, immersiveOpacity])

  useEffect(() => {
document.documentElement.dataset.immersive = 'true'
document.documentElement.style.setProperty('--pg-immersive-alpha', `${immersiveOpacity}%`)
  }, [immersiveOpacity])

useEffect(() => {
const handler = (e: KeyboardEvent) => {
const handleKeyboardEvent = (e: KeyboardEvent, keyboardAction: () => void) => {
e.preventDefault()
e.stopPropagation()
keyboardAction()
}
if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
handleKeyboardEvent(e, () => {
editorRef.current?.run()
shaderRef.current?.unpause()
})
return
}
if ((e.ctrlKey || e.metaKey) && e.key === '.') {
handleKeyboardEvent(e, () => shaderRef.current?.togglePlay())
return
}
if (e.altKey && e.key === 'Enter') {
handleKeyboardEvent(e, () => strudelRef.current?.play())
return
}
if (e.altKey && e.key === '.') {
handleKeyboardEvent(e, () => strudelRef.current?.pause())
}
}
window.addEventListener('keydown', handler, { capture: true })
return () => window.removeEventListener('keydown', handler, { capture: true })
}, [])

return (
<>
<OverwriteDialog
overwriteDialogOpen={overwriteDialogOpen}
overwritePending={overwritePending}
dontShowAgain={dontShowAgain}
setDontShowAgain={setDontShowAgain}
handleOverwriteConfirm={handleOverwriteConfirm}
handleOverwriteCancel={handleOverwriteCancel}
/>
<Box
ref={outerContainerRef}
sx={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}
>
{/* Layer 0 – Shader canvas, full viewport, behind everything */}
<Box sx={{ position: 'absolute', inset: 0, zIndex: 0 }}>
<ShaderPane
ref={shaderRef}
shaderSource={shaderSource}
onShaderError={setShaderError}
onPlayStateChange={setImmersiveShaderPlaying}
onRecordingStateChange={setImmersiveShaderRecording}
onFullscreenStateChange={setImmersiveShaderFullscreen}
/>
</Box>

{/* Layer 1 – Editor overlay + controls bar stacked in one flex column */}
<Box sx={{ position: 'absolute', inset: 0, zIndex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
{/* Editor area – flex:1 so it fills space above the controls bar */}
<Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
<ThemeProvider theme={immersiveTheme}>
<EditorContent
viewMode={viewMode}
shaderError={shaderError}
editorRef={editorRef}
strudelRef={strudelRef}
setShaderSource={setShaderSource}
setViewMode={setViewMode}
setOverwritePending={setOverwritePending}
setOverwriteDialogOpen={setOverwriteDialogOpen}
setDontShowAgain={setDontShowAgain}
commitSave={commitSave}
/>
</ThemeProvider>
</Box>

{/* Controls bar sits at the bottom and takes its natural height */}
<ShaderControls
isPlaying={immersiveShaderPlaying}
isRecording={immersiveShaderRecording}
isFullscreen={immersiveShaderFullscreen}
onTogglePlay={() => shaderRef.current?.togglePlay()}
onStartRecording={() => shaderRef.current?.startRecording()}
onStopRecording={() => shaderRef.current?.stopRecording()}
onToggleFullscreen={() => shaderRef.current?.toggleFullscreen()}
/>
</Box>

{/* Layer 2 – Pills float over the editor, pointer-events passthrough on the wrapper */}
<Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2, pointerEvents: 'none' }}>
<ThemeProvider theme={immersiveTheme}>
<ImmersiveTopBar
viewMode={viewMode}
setViewMode={setViewMode}
strudelRef={strudelRef}
editorRef={editorRef}
/>
</ThemeProvider>
</Box>
</Box>
</>
)
}
