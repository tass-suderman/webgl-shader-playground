import { useEffect } from 'react'
import { useAppStorage } from './useAppStorage'

type StrudelMirrorExt = {
	changeSetting: (key: string, value: unknown) => void
}

export function useStrudelSettings(mirrorRef: React.RefObject<StrudelMirrorExt | null>) {
	const { vimMode, fontSize, strudelAutocomplete } = useAppStorage()

	// mirrorRef is a stable React ref and intentionally omitted from deps arrays
	useEffect(() => {
		mirrorRef.current?.changeSetting('keybindings', vimMode ? 'vim' : 'codemirror')
	}, [vimMode])

	useEffect(() => {
		mirrorRef.current?.changeSetting('fontSize', fontSize)
	}, [fontSize])

	useEffect(() => {
		mirrorRef.current?.changeSetting('isAutoCompletionEnabled', strudelAutocomplete)
	}, [strudelAutocomplete])

	return { vimMode, fontSize, strudelAutocomplete }
}
