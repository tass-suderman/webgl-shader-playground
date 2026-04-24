import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './components/App/App'
import CssBaseline from '@mui/material/CssBaseline'
import './index.css'
import { AppStorageProvider } from './hooks/useAppStorage'
import { MediaStreamsProvider } from './hooks/useMediaStreams'
import { StrudelAnalyzerProvider } from './hooks/useStrudelAnalyzer'
import { StrudelAudioStreamProvider } from './hooks/useStrudelAudioStream'
import { SavedContentProvider } from './hooks/useSavedContent'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <StrudelAnalyzerProvider>
      <StrudelAudioStreamProvider>
        <MediaStreamsProvider>
          <SavedContentProvider>
            <AppStorageProvider>	
              <CssBaseline />
              <App />
            </AppStorageProvider>
          </SavedContentProvider>
        </MediaStreamsProvider>
      </StrudelAudioStreamProvider>
    </StrudelAnalyzerProvider>
  </React.StrictMode>,
)
