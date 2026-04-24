import { createContext, useContext, useState } from 'react'

type StrudelAudioStreamContextType = {
	strudelAudioStream: MediaStream | null
	setStrudelAudioStream: (stream: MediaStream | null) => void
}

const StrudelAudioStreamContext = createContext<StrudelAudioStreamContextType | null>(null)

export const StrudelAudioStreamProvider = ({ children }: { children: React.ReactNode }) => {
  const [strudelAudioStream, setStrudelAudioStream] = useState<MediaStream | null>(null)
	
  return (
    <StrudelAudioStreamContext.Provider value={{ strudelAudioStream, setStrudelAudioStream }}>
      {children}
    </StrudelAudioStreamContext.Provider>
  );
}

export const useStrudelAudioStream = () => {
  const context = useContext(StrudelAudioStreamContext)

  if(!context) {
    throw new Error('useStrudelAudioStream must be used within a StrudelAudioStreamProvider')
  }
	
  const updateStrudelAudioStream = (stream: MediaStream | null) => {
    context.setStrudelAudioStream(stream)
  }
	
  return {
    strudelAudioStream: context.strudelAudioStream,
    setStrudelAudioStream: updateStrudelAudioStream,
  }
}
