import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, act } from '@testing-library/react'
import React, { forwardRef, useImperativeHandle } from 'react'

// ---------------------------------------------------------------------------
// Mocks – all heavy components replaced with thin stubs
// ---------------------------------------------------------------------------

const { mockShaderPane, mockEditorPane, mockPlay, mockPause, mockShaderPause } = vi.hoisted(() => ({
  mockShaderPane: vi.fn(),
  mockEditorPane: vi.fn(),
  mockPlay: vi.fn(),
  mockPause: vi.fn(),
  mockShaderPause: vi.fn(),
}))

vi.mock('./components/ShaderPane', () => ({
  default: forwardRef((props: { shaderSource: string }, ref: React.Ref<{ pause: () => void }>) => {
    mockShaderPane(props)
    useImperativeHandle(ref, () => ({ pause: mockShaderPause }), [])
    return <div data-testid="shader-pane" data-source={props.shaderSource} />
  }),
}))

vi.mock('./components/EditorPane', () => ({
  default: (props: { pendingSource: string; onCodeChange: (c: string) => void }) => {
    mockEditorPane(props)
    return <div data-testid="editor-pane" />
  },
}))

vi.mock('./components/StrudelPane', () => ({
  default: forwardRef((_props: unknown, ref: React.Ref<{ play: () => void; pause: () => void }>) => {
    useImperativeHandle(ref, () => ({ play: mockPlay, pause: mockPause }), [])
    return <div data-testid="strudel-pane" />
  }),
}))

// ---------------------------------------------------------------------------
// Component under test (imported after mocks)
// ---------------------------------------------------------------------------
import App from './App'
import { DEFAULT_SHADER } from './shaders/default'

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('App – global keyboard shortcuts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('Ctrl+Enter prevents the default browser action', () => {
    render(<App />)
    const event = new KeyboardEvent('keydown', {
      key: 'Enter',
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    })
    act(() => window.dispatchEvent(event))
    expect(event.defaultPrevented).toBe(true)
  })

  it('Ctrl+Enter runs the shader (passes pendingSource to ShaderPane)', () => {
    render(<App />)
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true, bubbles: true, cancelable: true }),
      )
    })
    // ShaderPane should receive the current pendingSource (which starts as DEFAULT_SHADER)
    const latestCall = mockShaderPane.mock.calls.at(-1)?.[0]
    expect(latestCall?.shaderSource).toBe(DEFAULT_SHADER)
  })

  it('Ctrl+. prevents the default browser action', () => {
    render(<App />)
    const event = new KeyboardEvent('keydown', {
      key: '.',
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    })
    act(() => window.dispatchEvent(event))
    expect(event.defaultPrevented).toBe(true)
  })

  it('Ctrl+. pauses the shader', () => {
    render(<App />)
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: '.', ctrlKey: true, bubbles: true, cancelable: true }),
      )
    })
    expect(mockShaderPause).toHaveBeenCalledTimes(1)
  })

  it('Alt+Enter prevents the default browser action', () => {
    render(<App />)
    const event = new KeyboardEvent('keydown', {
      key: 'Enter',
      altKey: true,
      bubbles: true,
      cancelable: true,
    })
    act(() => window.dispatchEvent(event))
    expect(event.defaultPrevented).toBe(true)
  })

  it('Alt+Enter calls play() on the StrudelPane', () => {
    render(<App />)
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', altKey: true, bubbles: true, cancelable: true }),
      )
    })
    expect(mockPlay).toHaveBeenCalledTimes(1)
    expect(mockPause).not.toHaveBeenCalled()
  })

  it('Alt+. prevents the default browser action', () => {
    render(<App />)
    const event = new KeyboardEvent('keydown', {
      key: '.',
      altKey: true,
      bubbles: true,
      cancelable: true,
    })
    act(() => window.dispatchEvent(event))
    expect(event.defaultPrevented).toBe(true)
  })

  it('Alt+. calls pause() on the StrudelPane', () => {
    render(<App />)
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: '.', altKey: true, bubbles: true, cancelable: true }),
      )
    })
    expect(mockPause).toHaveBeenCalledTimes(1)
    expect(mockPlay).not.toHaveBeenCalled()
  })

  it('other keys do not prevent default', () => {
    render(<App />)
    const event = new KeyboardEvent('keydown', {
      key: 'a',
      bubbles: true,
      cancelable: true,
    })
    act(() => window.dispatchEvent(event))
    expect(event.defaultPrevented).toBe(false)
  })
})
