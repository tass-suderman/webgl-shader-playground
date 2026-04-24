import { GlobalStyles, ThemeProvider } from '@mui/material'
import { useTheme } from '../../hooks/useTheme'
import { ImmersiveView } from '../ImmersiveView/ImmersiveView'

export default function App() {
  const { muiTheme } = useTheme()
  return (
    <ThemeProvider theme={muiTheme}>
      <GlobalStyles styles={{
        '.MuiTypography-root': {
          color: 'textColor.primary',
        },
      }} />
      <ImmersiveView />
    </ThemeProvider>
  )
}

