import { useEffect, useRef, useCallback } from 'react'
import type { RefObject } from 'react'

const VERTEX_SHADER_SRC = `
  attribute vec2 aPosition;
  void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`

function createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const err = gl.getShaderInfoLog(shader)
    gl.deleteShader(shader)
    throw new Error(err ?? 'Shader compilation failed')
  }
  return shader
}

function createProgram(gl: WebGLRenderingContext, vertSrc: string, fragSrc: string): WebGLProgram | null {
  const vert = createShader(gl, gl.VERTEX_SHADER, vertSrc)
  const frag = createShader(gl, gl.FRAGMENT_SHADER, fragSrc)
  if (!vert || !frag) return null
  const program = gl.createProgram()
  if (!program) return null
  gl.attachShader(program, vert)
  gl.attachShader(program, frag)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const err = gl.getProgramInfoLog(program)
    gl.deleteProgram(program)
    throw new Error(err ?? 'Program link failed')
  }
  return program
}

interface UseWebGLOptions {
  shaderSource: string
  /** Video stream for iChannel0 (webcam) */
  webcamStream: MediaStream | null
  /** Audio stream for iChannel1 (microphone or system audio) */
  audioStream: MediaStream | null
  /** Strudel audio analyser for iChannel2 */
  strudelAnalyser?: AnalyserNode | null
  isPlaying: boolean
  onError?: (error: string | null) => void
}

export function useWebGL(
  canvasRef: RefObject<HTMLCanvasElement>,
  options: UseWebGLOptions
) {
  const { shaderSource, webcamStream, audioStream, strudelAnalyser, isPlaying, onError } = options
  const glRef = useRef<WebGLRenderingContext | null>(null)
  const programRef = useRef<WebGLProgram | null>(null)
  const rafRef = useRef<number>(0)
  const startTimeRef = useRef<number>(Date.now())
  const frameRef = useRef<number>(0)
  // Track elapsed time at pause so resuming doesn't jump
  const elapsedAtPauseRef = useRef<number>(0)
  const mouseRef = useRef<[number, number, number, number]>([0, 0, 0, 0])
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const textureRef = useRef<WebGLTexture | null>(null)
  const texture1Ref = useRef<WebGLTexture | null>(null)
  const texture2Ref = useRef<WebGLTexture | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)

  const onErrorRef = useRef(onError)
  onErrorRef.current = onError

  // Reusable typed arrays for audio FFT data – allocated once per channel to
  // avoid creating thousands of short-lived objects per second in the render loop.
  const fftBufferRef = useRef<Uint8Array | null>(null)
  const fftRgbaBufferRef = useRef<Uint8Array | null>(null)
  const fftBuffer2Ref = useRef<Uint8Array | null>(null)
  const fftRgbaBuffer2Ref = useRef<Uint8Array | null>(null)

  const compileProgram = useCallback((gl: WebGLRenderingContext, fragSrc: string) => {
    if (programRef.current) {
      gl.deleteProgram(programRef.current)
      programRef.current = null
    }
    try {
      const program = createProgram(gl, VERTEX_SHADER_SRC, fragSrc)
      if (!program) throw new Error('Failed to create program')
      programRef.current = program
      onErrorRef.current?.(null)

      // Set up geometry (fullscreen quad)
      const buf = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, buf)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -1, -1,  1, -1,  -1, 1,
        -1,  1,  1, -1,   1, 1,
      ]), gl.STATIC_DRAW)
      const aPos = gl.getAttribLocation(program, 'aPosition')
      gl.enableVertexAttribArray(aPos)
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error('Shader error:', msg)
      onErrorRef.current?.(msg)
    }
  }, [])

  // Init WebGL context
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const gl = canvas.getContext('webgl')
    if (!gl) {
      console.error('WebGL not supported')
      return
    }
    glRef.current = gl

    // Create texture for webcam (iChannel0)
    const tex = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    textureRef.current = tex

    // Create texture for audio (iChannel1)
    const tex1 = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, tex1)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    texture1Ref.current = tex1

    // Create texture for Strudel audio (iChannel2)
    const tex2 = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, tex2)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    texture2Ref.current = tex2

    compileProgram(gl, shaderSource)

    return () => {
      cancelAnimationFrame(rafRef.current)
      if (programRef.current) {
        gl.deleteProgram(programRef.current)
        programRef.current = null
      }
      gl.deleteTexture(textureRef.current)
      gl.deleteTexture(texture1Ref.current)
      gl.deleteTexture(texture2Ref.current)
      textureRef.current = null
      texture1Ref.current = null
      texture2Ref.current = null
      glRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Recompile when shader source changes
  useEffect(() => {
    const gl = glRef.current
    if (!gl) return
    compileProgram(gl, shaderSource)
  }, [shaderSource, compileProgram])

  // Setup webcam video element
  useEffect(() => {
    if (webcamStream) {
      const video = document.createElement('video')
      video.srcObject = webcamStream
      video.autoplay = true
      video.muted = true
      video.playsInline = true
      video.play().catch(console.error)
      videoRef.current = video
    } else {
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
      videoRef.current = null
    }
    return () => {
      if (videoRef.current) {
        videoRef.current.srcObject = null
        videoRef.current = null
      }
    }
  }, [webcamStream])

  // Setup audio analyser for iChannel1
  useEffect(() => {
    if (audioStream) {
      const audioCtx = new AudioContext()
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 256
      const source = audioCtx.createMediaStreamSource(audioStream)
      source.connect(analyser)
      analyserRef.current = analyser
      audioCtxRef.current = audioCtx
    } else {
      if (audioCtxRef.current) {
        const ctx = audioCtxRef.current
        audioCtxRef.current = null
        analyserRef.current = null
        ctx.close().catch(console.error)
      }
    }
    return () => {
      if (audioCtxRef.current) {
        const ctx = audioCtxRef.current
        audioCtxRef.current = null
        analyserRef.current = null
        ctx.close().catch(console.error)
      }
    }
  }, [audioStream])

  // Mouse tracking
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current[0] = e.clientX - rect.left
      mouseRef.current[1] = canvas.height - (e.clientY - rect.top)
    }
    const handleMouseDown = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current[2] = e.clientX - rect.left
      mouseRef.current[3] = canvas.height - (e.clientY - rect.top)
    }
    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mousedown', handleMouseDown)
    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mousedown', handleMouseDown)
    }
  }, [canvasRef])

  // Render loop
  useEffect(() => {
    if (!isPlaying) {
      // Save elapsed time so we can resume from the right point
      elapsedAtPauseRef.current = (Date.now() - startTimeRef.current) / 1000
      cancelAnimationFrame(rafRef.current)
      return
    }

    // Resume: set startTime so that elapsed time continues from where we paused
    startTimeRef.current = Date.now() - elapsedAtPauseRef.current * 1000

    const render = () => {
      const gl = glRef.current
      const program = programRef.current
      const canvas = canvasRef.current
      if (!gl || !program || !canvas) {
        rafRef.current = requestAnimationFrame(render)
        return
      }

      // Resize canvas to display size
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
        gl.viewport(0, 0, w, h)
      }

      const iTime = (Date.now() - startTimeRef.current) / 1000
      frameRef.current++

      gl.useProgram(program)

      // Set uniforms
      const loc1f = (name: string, v: number) => {
        const loc = gl.getUniformLocation(program, name)
        if (loc) gl.uniform1f(loc, v)
      }
      const loc2f = (name: string, x: number, y: number) => {
        const loc = gl.getUniformLocation(program, name)
        if (loc) gl.uniform2f(loc, x, y)
      }
      const loc4f = (name: string, x: number, y: number, z: number, w: number) => {
        const loc = gl.getUniformLocation(program, name)
        if (loc) gl.uniform4f(loc, x, y, z, w)
      }

      loc1f('iTime', iTime)
      loc2f('iResolution', canvas.width, canvas.height)
      loc4f('iMouse', mouseRef.current[0], mouseRef.current[1], mouseRef.current[2], mouseRef.current[3])

      const frameLoc = gl.getUniformLocation(program, 'iFrame')
      if (frameLoc) gl.uniform1i(frameLoc, frameRef.current)

      // iChannel0: webcam video
      const ch0EnabledLoc = gl.getUniformLocation(program, 'iChannel0Enabled')
      if (webcamStream && videoRef.current && videoRef.current.readyState >= 2) {
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, textureRef.current)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, videoRef.current)
        const ch0Loc = gl.getUniformLocation(program, 'iChannel0')
        if (ch0Loc) gl.uniform1i(ch0Loc, 0)
        if (ch0EnabledLoc) gl.uniform1i(ch0EnabledLoc, 1)
      } else {
        if (ch0EnabledLoc) gl.uniform1i(ch0EnabledLoc, 0)
      }

      // iChannel1: audio frequency data (mic or system audio)
      const ch1EnabledLoc = gl.getUniformLocation(program, 'iChannel1Enabled')
      if (audioStream && analyserRef.current) {
        const bufferLength = analyserRef.current.frequencyBinCount
        // Reuse typed arrays to avoid per-frame allocations
        if (!fftBufferRef.current || fftBufferRef.current.length !== bufferLength) {
          fftBufferRef.current = new Uint8Array(bufferLength)
          fftRgbaBufferRef.current = new Uint8Array(bufferLength * 4)
        }
        const dataArray = fftBufferRef.current
        const rgba = fftRgbaBufferRef.current!
        analyserRef.current.getByteFrequencyData(dataArray)
        for (let i = 0; i < bufferLength; i++) {
          rgba[i * 4] = dataArray[i]
          rgba[i * 4 + 1] = dataArray[i]
          rgba[i * 4 + 2] = dataArray[i]
          rgba[i * 4 + 3] = 255
        }
        gl.activeTexture(gl.TEXTURE1)
        gl.bindTexture(gl.TEXTURE_2D, texture1Ref.current)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, bufferLength, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, rgba)
        const ch1Loc = gl.getUniformLocation(program, 'iChannel1')
        if (ch1Loc) gl.uniform1i(ch1Loc, 1)
        if (ch1EnabledLoc) gl.uniform1i(ch1EnabledLoc, 1)
      } else {
        if (ch1EnabledLoc) gl.uniform1i(ch1EnabledLoc, 0)
      }

      // iChannel2: Strudel audio frequency data
      const ch2EnabledLoc = gl.getUniformLocation(program, 'iChannel2Enabled')
      if (strudelAnalyser) {
        const bufferLength2 = strudelAnalyser.frequencyBinCount
        // Reuse typed arrays to avoid per-frame allocations
        if (!fftBuffer2Ref.current || fftBuffer2Ref.current.length !== bufferLength2) {
          fftBuffer2Ref.current = new Uint8Array(bufferLength2)
          fftRgbaBuffer2Ref.current = new Uint8Array(bufferLength2 * 4)
        }
        const dataArray2 = fftBuffer2Ref.current
        const rgba2 = fftRgbaBuffer2Ref.current!
        strudelAnalyser.getByteFrequencyData(dataArray2)
        for (let i = 0; i < bufferLength2; i++) {
          rgba2[i * 4] = dataArray2[i]
          rgba2[i * 4 + 1] = dataArray2[i]
          rgba2[i * 4 + 2] = dataArray2[i]
          rgba2[i * 4 + 3] = 255
        }
        gl.activeTexture(gl.TEXTURE2)
        gl.bindTexture(gl.TEXTURE_2D, texture2Ref.current)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, bufferLength2, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, rgba2)
        const ch2Loc = gl.getUniformLocation(program, 'iChannel2')
        if (ch2Loc) gl.uniform1i(ch2Loc, 2)
        if (ch2EnabledLoc) gl.uniform1i(ch2EnabledLoc, 1)
      } else {
        if (ch2EnabledLoc) gl.uniform1i(ch2EnabledLoc, 0)
      }

      gl.drawArrays(gl.TRIANGLES, 0, 6)
      rafRef.current = requestAnimationFrame(render)
    }

    rafRef.current = requestAnimationFrame(render)
    return () => cancelAnimationFrame(rafRef.current)
  }, [isPlaying, webcamStream, audioStream, strudelAnalyser, shaderSource, canvasRef])
}
