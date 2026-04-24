import { useCallback, useRef, useState } from 'react'
import { useAppStorage, getInitialGlslCode } from './useAppStorage'
import { useSavedContent } from './useSavedContent'
import { type ViewMode } from '../utility/tabConfigs'

export interface OverwritePending {
	title: string
	content: string
	type: 'shader' | 'pattern'
}

export function useViewState() {
  const [viewMode, setViewMode] = useState<ViewMode>('glsl')
  const [shaderSource, setShaderSource] = useState<string>(getInitialGlslCode())
  const [shaderError, setShaderError] = useState<string | null>(null)
  const [overwriteDialogOpen, setOverwriteDialogOpen] = useState(false)
  const [dontShowAgain, setDontShowAgain] = useState(false)
  const [overwritePending, setOverwritePending] = useState<OverwritePending | null>(null)

  const outerContainerRef = useRef<HTMLDivElement>(null)

  const { setWarnOnOverwrite } = useAppStorage()
  const savedContent = useSavedContent()

  const commitSave = useCallback((title: string, content: string, type: 'shader' | 'pattern') => {
    if (type === 'shader') {
      savedContent.saveShader(title, content)
    } else {
      savedContent.savePattern(title, content)
    }
  }, [savedContent])

  const handleOverwriteCancel = useCallback(() => {
    setOverwriteDialogOpen(false)
    setOverwritePending(null)
  }, [])

  const handleOverwriteConfirm = useCallback(() => {
    if (overwritePending) {
      if (dontShowAgain) {
        setWarnOnOverwrite(false)
      }
      commitSave(overwritePending.title, overwritePending.content, overwritePending.type)
    }
    setOverwriteDialogOpen(false)
    setOverwritePending(null)
  }, [overwritePending, dontShowAgain, setWarnOnOverwrite, commitSave])

  return {
    viewMode,
    setViewMode,
    shaderSource,
    setShaderSource,
    shaderError,
    setShaderError,
    overwriteDialogOpen,
    dontShowAgain,
    setDontShowAgain,
    overwritePending,
    setOverwritePending,
    setOverwriteDialogOpen,
    outerContainerRef,
    commitSave,
    handleOverwriteCancel,
    handleOverwriteConfirm,
  }
}
