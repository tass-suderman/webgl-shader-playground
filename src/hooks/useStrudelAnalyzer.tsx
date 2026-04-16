import { createContext, useContext, useState } from 'react'

type StrudelAnalyzerContextType = {
	analyzer: AnalyserNode | null
	setAnalyzer: (analyzer: AnalyserNode | null) => void
}

const StrudelAnalyzerContext = createContext<StrudelAnalyzerContextType | null>(null)
	
export const StrudelAnalyzerProvider = ({ children }: { children: React.ReactNode }) => {
	const [analyzer, setAnalyzer] = useState<AnalyserNode | null>(null)

	return (
		<StrudelAnalyzerContext.Provider value={{ analyzer, setAnalyzer }}>
			{children}
		</StrudelAnalyzerContext.Provider>
	);
};

export const useStrudelAnalyzer = () => {
	const context = useContext(StrudelAnalyzerContext)
	
	if(!context) {
		throw new Error('useStrudelAnalyzer must be used within a StrudelAnalyzerProvider')
	}

	const updateAnalyzer = (analyzer: AnalyserNode | null) => {
		context.setAnalyzer(analyzer)
	}

	return {
		analyzer: context.analyzer,
		setAnalyzer: updateAnalyzer,
	};
}
