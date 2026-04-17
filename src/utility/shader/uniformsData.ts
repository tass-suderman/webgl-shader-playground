// ---------------------------------------------------------------------------
// GLSL uniforms reference data
// ---------------------------------------------------------------------------

export interface UniformEntry {
  name: string
  type: string
  description: string
}

export const UNIFORMS: readonly UniformEntry[] = [
  {
    name: 'iTime',
    type: 'float',
    description: 'Shader playback time in seconds.',
  },
  {
    name: 'iResolution',
    type: 'vec2',
    description: 'Viewport resolution in pixels (width, height).',
  },
  {
    name: 'iMouse',
    type: 'vec4',
    description: 'Mouse pixel coords. xy: current position, zw: position at last click.',
  },
  {
    name: 'iFrame',
    type: 'int',
    description: 'Current frame number (increments each rendered frame).',
  },
  {
    name: 'iChannel0',
    type: 'sampler2D',
    description: 'Webcam texture. Enable webcam in the controls to populate this.',
  },
  {
    name: 'iChannel0Enabled',
    type: 'bool',
    description: 'True when the webcam is active and iChannel0 contains a valid texture.',
  },
  {
    name: 'iChannel1',
    type: 'sampler2D',
    description: 'Microphone audio frequency texture (1-D, red channel = frequency bin amplitude). Enable mic in the controls.',
  },
  {
    name: 'iChannel1Enabled',
    type: 'bool',
    description: 'True when microphone is active and iChannel1 contains data.',
  },
  {
    name: 'iChannel2',
    type: 'sampler2D',
    description: 'Strudel live-coding audio frequency texture (same layout as iChannel1). Active when Strudel is playing.',
  },
  {
    name: 'iChannel2Enabled',
    type: 'bool',
    description: 'True when Strudel audio is active and iChannel2 contains data.',
  },
] as const
