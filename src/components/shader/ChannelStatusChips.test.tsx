import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ChannelStatusChips from './ChannelStatusChips'

describe('ChannelStatusChips', () => {
  it('renders no chips when nothing is enabled', () => {
    render(
      <ChannelStatusChips
        webcamEnabled={false}
        micEnabled={false}
        systemAudioEnabled={false}
        strudelAnalyser={null}
      />,
    )
    expect(screen.queryByText(/iChannel/i)).not.toBeInTheDocument()
  })

  it('renders webcam chip when webcam is enabled', () => {
    render(
      <ChannelStatusChips
        webcamEnabled={true}
        micEnabled={false}
        systemAudioEnabled={false}
        strudelAnalyser={null}
      />,
    )
    expect(screen.getByText('iChannel0: Webcam')).toBeInTheDocument()
  })

  it('renders mic chip when mic is enabled', () => {
    render(
      <ChannelStatusChips
        webcamEnabled={false}
        micEnabled={true}
        systemAudioEnabled={false}
        strudelAnalyser={null}
      />,
    )
    expect(screen.getByText('iChannel1: Mic')).toBeInTheDocument()
  })

  it('renders system audio chip when system audio is enabled', () => {
    render(
      <ChannelStatusChips
        webcamEnabled={false}
        micEnabled={false}
        systemAudioEnabled={true}
        strudelAnalyser={null}
      />,
    )
    expect(screen.getByText('iChannel1: System Audio')).toBeInTheDocument()
  })

  it('renders Strudel chip when strudelAnalyser is set', () => {
    render(
      <ChannelStatusChips
        webcamEnabled={false}
        micEnabled={false}
        systemAudioEnabled={false}
        strudelAnalyser={{} as AnalyserNode}
      />,
    )
    expect(screen.getByText('iChannel2: Strudel')).toBeInTheDocument()
  })

  it('renders multiple chips simultaneously', () => {
    render(
      <ChannelStatusChips
        webcamEnabled={true}
        micEnabled={true}
        systemAudioEnabled={false}
        strudelAnalyser={{} as AnalyserNode}
      />,
    )
    expect(screen.getByText('iChannel0: Webcam')).toBeInTheDocument()
    expect(screen.getByText('iChannel1: Mic')).toBeInTheDocument()
    expect(screen.getByText('iChannel2: Strudel')).toBeInTheDocument()
  })
})
