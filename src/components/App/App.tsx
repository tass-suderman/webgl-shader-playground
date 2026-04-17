import { useEffect, useRef } from 'react'
import { GlobalStyles, ThemeProvider } from '@mui/material'
import { type ShaderPaneHandle } from '../ShaderPane/ShaderPane'
import { type StrudelPaneHandle } from '../StrudelPane/StrudelPane'
import { useTheme } from '../../hooks/useTheme'
import { ViewReducer } from '../ViewReducer/ViewReducer'

export default function App() {
  const strudelRef = useRef<StrudelPaneHandle>(null)
  const shaderRef = useRef<ShaderPaneHandle>(null)
	const { muiTheme } = useTheme();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
			const handleKeyboardEvent = (e: KeyboardEvent, keyboardAction: () => void) => {
				e.preventDefault()
				e.stopPropagation()
				keyboardAction()
			}

			// // TODO --> This is not working for compiling the shader right now
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
				handleKeyboardEvent(e, () => shaderRef.current?.unpause())
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
		<ThemeProvider theme={muiTheme}>
							<GlobalStyles styles={{
								'.MuiTypography-root': {
									color: 'textColor.primary',
								},
							}} />
							<ViewReducer
								strudelRef={strudelRef}
								shaderRef={shaderRef}
							/>
		</ThemeProvider>
  )
}

