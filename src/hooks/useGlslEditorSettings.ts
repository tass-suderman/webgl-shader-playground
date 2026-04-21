import { useEffect } from 'react'
import { EditorView } from '@codemirror/view'
import { Compartment } from '@codemirror/state'
import { autocompletion } from '@codemirror/autocomplete'
import { vim } from '@replit/codemirror-vim'
import { glslCompletions } from '../utility/shader/glslCodemirror'
import { useAppStorage } from './useAppStorage'

interface GlslEditorCompartments {
	vimCompartment: React.RefObject<Compartment>
	fontSizeCompartment: React.RefObject<Compartment>
	autocompleteCompartment: React.RefObject<Compartment>
}

export function useGlslEditorSettings(
	viewRef: React.RefObject<EditorView | null>,
	compartments: GlslEditorCompartments,
) {
	const { vimMode, fontSize, glslAutocomplete } = useAppStorage()

	// viewRef and compartment refs are stable React refs and intentionally omitted from deps arrays
	useEffect(() => {
		if (!compartments.vimCompartment.current) return
		viewRef.current?.dispatch({
			effects: compartments.vimCompartment.current.reconfigure(vimMode ? vim() : []),
		})
	}, [vimMode])

	useEffect(() => {
		if (!compartments.fontSizeCompartment.current) return
		viewRef.current?.dispatch({
			effects: compartments.fontSizeCompartment.current.reconfigure(
				EditorView.theme({ '&': { fontSize: `${fontSize}px` } }),
			),
		})
	}, [fontSize])

	useEffect(() => {
		if (!compartments.autocompleteCompartment.current) return
		viewRef.current?.dispatch({
			effects: compartments.autocompleteCompartment.current.reconfigure(
				glslAutocomplete ? autocompletion({ override: [glslCompletions] }) : [],
			),
		})
	}, [glslAutocomplete])

	return { vimMode, fontSize, glslAutocomplete }
}
