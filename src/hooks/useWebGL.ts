import { useEffect, useRef, useCallback } from 'react'
import type { RefObject } from 'react'

const VERTEX_SHADER_SRC = `
  attribute vec2 aPosition;
  void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`

// Channel indices and corresponding WebGL texture units for the three buffer passes.
// buffer index 0 → iChannel3 (TEXTURE3)
// buffer index 1 → iChannel4 (TEXTURE4)
// buffer index 2 → iChannel6 (TEXTURE6)
const BUFFER_CHANNEL_NUMS = [3, 4, 6] as const

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
  // Bind aPosition to location 0 before linking so all programs share the same layout
  gl.bindAttribLocation(program, 0, 'aPosition')
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const err = gl.getProgramInfoLog(program)
    gl.deleteProgram(program)
    throw new Error(err ?? 'Program link failed')
  }
  return program
}

/** State kept for each of the three buffer passes. */
interface BufferGL {
  programs: [WebGLProgram | null, WebGLProgram | null, WebGLProgram | null]
  /** Two ping-pong textures per buffer (index 0 and 1). */
  textures: [
    [WebGLTexture | null, WebGLTexture | null],
    [WebGLTexture | null, WebGLTexture | null],
    [WebGLTexture | null, WebGLTexture | null],
  ]
  /** FBOs that wrap the ping-pong textures. */
  fbos: [
    [WebGLFramebuffer | null, WebGLFramebuffer | null],
    [WebGLFramebuffer | null, WebGLFramebuffer | null],
    [WebGLFramebuffer | null, WebGLFramebuffer | null],
  ]
  /**
   * For each buffer, which texture index (0 or 1) currently holds the most
   * recently rendered frame (the "read" side). The write side is 1 - readIdx.
   */
  readIdx: [number, number, number]
  /** Dimensions of the buffer textures (used to detect when a resize is needed). */
  lastW: number
  lastH: number
}

interface UseWebGLOptions {
  shaderSource: string
  /**
   * Shader sources for the three buffer passes in channel order:
   * [iChannel3 source, iChannel4 source, iChannel6 source].
   * A null/empty entry means that buffer pass is inactive.
   */
  bufferSources?: [string | null, string | null, string | null]
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
  /** Single VBO shared by all programs (fullscreen quad). */
  const vboRef = useRef<WebGLBuffer | null>(null)
  /** All buffer-pass GL state. */
  const bufferGLRef = useRef<BufferGL | null>(null)

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
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error('Shader error:', msg)
      onErrorRef.current?.(msg)
    }
  }, [])

  /** Compile (or recompile) one of the three buffer programs. */
  const compileBufferProgram = useCallback((
    gl: WebGLRenderingContext,
    fragSrc: string,
    bufIndex: number,
  ) => {
    const bufs = bufferGLRef.current
    if (!bufs) return
    const old = bufs.programs[bufIndex]
    if (old) {
      gl.deleteProgram(old)
      bufs.programs[bufIndex] = null
    }
    if (!fragSrc.trim()) return
    try {
      const program = createProgram(gl, VERTEX_SHADER_SRC, fragSrc)
      if (!program) throw new Error('Failed to create buffer program')
      bufs.programs[bufIndex] = program
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      const channelNum = BUFFER_CHANNEL_NUMS[bufIndex]
      console.error(`Buffer iChannel${channelNum} shader error:`, msg)
      // Surface buffer errors via the shared error callback with a prefix so
      // the user can tell which pass failed.
      onErrorRef.current?.(`iChannel${channelNum}: ${msg}`)
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

    // ── Shared fullscreen-quad VBO (used by all programs) ──────────────────
    const vbo = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,  1, -1,  -1, 1,
      -1,  1,  1, -1,   1, 1,
    ]), gl.STATIC_DRAW)
    // aPosition is always at location 0 (enforced via bindAttribLocation)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
    vboRef.current = vbo

    // ── iChannel0 – webcam ─────────────────────────────────────────────────
    const tex = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    textureRef.current = tex

    // ── iChannel1 – mic audio ──────────────────────────────────────────────
    const tex1 = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, tex1)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    texture1Ref.current = tex1

    // ── iChannel2 – Strudel audio ──────────────────────────────────────────
    const tex2 = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, tex2)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    texture2Ref.current = tex2

    // ── Buffer passes (iChannel3, iChannel4, iChannel6) ────────────────────
    // Each buffer uses two ping-pong textures and two FBOs.
    // Textures start as 1x1 black; they are resized to canvas dimensions on the
    // first rendered frame (and again whenever the canvas is resized).
    const makePingPongPair = (): [WebGLTexture | null, WebGLTexture | null] => {
      const pair: [WebGLTexture | null, WebGLTexture | null] = [null, null]
      for (let t = 0; t < 2; t++) {
        const bt = gl.createTexture()
        gl.bindTexture(gl.TEXTURE_2D, bt)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
        // Initialise to a valid 1x1 black pixel so the FBO attachment is valid
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]))
        pair[t] = bt
      }
      return pair
    }

    const makeFBOPair = (
      texPair: [WebGLTexture | null, WebGLTexture | null],
    ): [WebGLFramebuffer | null, WebGLFramebuffer | null] => {
      const pair: [WebGLFramebuffer | null, WebGLFramebuffer | null] = [null, null]
      for (let t = 0; t < 2; t++) {
        const fbo = gl.createFramebuffer()
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texPair[t], 0)
        pair[t] = fbo
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      return pair
    }

    const texPair3 = makePingPongPair()
    const texPair4 = makePingPongPair()
    const texPair6 = makePingPongPair()

    bufferGLRef.current = {
      programs: [null, null, null],
      textures: [texPair3, texPair4, texPair6],
      fbos: [makeFBOPair(texPair3), makeFBOPair(texPair4), makeFBOPair(texPair6)],
      readIdx: [0, 0, 0],
      lastW: 0,
      lastH: 0,
    }

    compileProgram(gl, shaderSource)

    return () => {
      cancelAnimationFrame(rafRef.current)
      if (programRef.current) {
        gl.deleteProgram(programRef.current)
        programRef.current = null
      }
      // Clean up buffer GL resources
      const bufs = bufferGLRef.current
      if (bufs) {
        for (let b = 0; b < 3; b++) {
          if (bufs.programs[b]) gl.deleteProgram(bufs.programs[b]!)
          for (let t = 0; t < 2; t++) {
            if (bufs.textures[b][t]) gl.deleteTexture(bufs.textures[b][t])
            if (bufs.fbos[b][t]) gl.deleteFramebuffer(bufs.fbos[b][t])
          }
        }
        bufferGLRef.current = null
      }
      gl.deleteTexture(textureRef.current)
      gl.deleteTexture(texture1Ref.current)
      gl.deleteTexture(texture2Ref.current)
      if (vboRef.current) gl.deleteBuffer(vboRef.current)
      textureRef.current = null
      texture1Ref.current = null
      texture2Ref.current = null
      vboRef.current = null
      glRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Recompile main program when shader source changes
  useEffect(() => {
    const gl = glRef.current
    if (!gl) return
    compileProgram(gl, shaderSource)
  }, [shaderSource, compileProgram])

  // Recompile buffer programs when their sources change
  const [bufSource3, bufSource4, bufSource6] = options.bufferSources ?? [null, null, null]

  useEffect(() => {
    const gl = glRef.current
    if (!gl) return
    compileBufferProgram(gl, bufSource3 ?? '', 0)
  }, [bufSource3, compileBufferProgram])

  useEffect(() => {
    const gl = glRef.current
    if (!gl) return
    compileBufferProgram(gl, bufSource4 ?? '', 1)
  }, [bufSource4, compileBufferProgram])

  useEffect(() => {
    const gl = glRef.current
    if (!gl) return
    compileBufferProgram(gl, bufSource6 ?? '', 2)
  }, [bufSource6, compileBufferProgram])

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

      // Resize buffer textures whenever the canvas dimensions change
      const bufs = bufferGLRef.current
      if (bufs && (bufs.lastW !== w || bufs.lastH !== h)) {
        bufs.lastW = w
        bufs.lastH = h
        for (let b = 0; b < 3; b++) {
          for (let t = 0; t < 2; t++) {
            const bt = bufs.textures[b][t]
            if (bt) {
              gl.bindTexture(gl.TEXTURE_2D, bt)
              gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
            }
          }
        }
      }

      const iTime = (Date.now() - startTimeRef.current) / 1000
      frameRef.current++

      // ── Helper: set standard uniforms for the given program ──────────────
      const setStandardUniforms = (prog: WebGLProgram) => {
        const u1f = (name: string, v: number) => {
          const loc = gl.getUniformLocation(prog, name)
          if (loc) gl.uniform1f(loc, v)
        }
        const u2f = (name: string, x: number, y: number) => {
          const loc = gl.getUniformLocation(prog, name)
          if (loc) gl.uniform2f(loc, x, y)
        }
        const u4f = (name: string, x: number, y: number, z: number, w: number) => {
          const loc = gl.getUniformLocation(prog, name)
          if (loc) gl.uniform4f(loc, x, y, z, w)
        }
        u1f('iTime', iTime)
        u2f('iResolution', w, h)
        u4f('iMouse', mouseRef.current[0], mouseRef.current[1], mouseRef.current[2], mouseRef.current[3])
        const frameLoc = gl.getUniformLocation(prog, 'iFrame')
        if (frameLoc) gl.uniform1i(frameLoc, frameRef.current)
      }

      // ── Helper: bind iChannel0/1/2 (webcam / mic / strudel) ─────────────
      const bindMediaChannels = (prog: WebGLProgram) => {
        // iChannel0: webcam video
        const ch0EnabledLoc = gl.getUniformLocation(prog, 'iChannel0Enabled')
        if (webcamStream && videoRef.current && videoRef.current.readyState >= 2) {
          gl.activeTexture(gl.TEXTURE0)
          gl.bindTexture(gl.TEXTURE_2D, textureRef.current)
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, videoRef.current)
          const ch0Loc = gl.getUniformLocation(prog, 'iChannel0')
          if (ch0Loc) gl.uniform1i(ch0Loc, 0)
          if (ch0EnabledLoc) gl.uniform1i(ch0EnabledLoc, 1)
        } else {
          if (ch0EnabledLoc) gl.uniform1i(ch0EnabledLoc, 0)
        }

        // iChannel1: audio frequency data (mic or system audio)
        const ch1EnabledLoc = gl.getUniformLocation(prog, 'iChannel1Enabled')
        if (audioStream && analyserRef.current) {
          const bufferLength = analyserRef.current.frequencyBinCount
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
          const ch1Loc = gl.getUniformLocation(prog, 'iChannel1')
          if (ch1Loc) gl.uniform1i(ch1Loc, 1)
          if (ch1EnabledLoc) gl.uniform1i(ch1EnabledLoc, 1)
        } else {
          if (ch1EnabledLoc) gl.uniform1i(ch1EnabledLoc, 0)
        }

        // iChannel2: Strudel audio frequency data
        const ch2EnabledLoc = gl.getUniformLocation(prog, 'iChannel2Enabled')
        if (strudelAnalyser) {
          const bufferLength2 = strudelAnalyser.frequencyBinCount
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
          const ch2Loc = gl.getUniformLocation(prog, 'iChannel2')
          if (ch2Loc) gl.uniform1i(ch2Loc, 2)
          if (ch2EnabledLoc) gl.uniform1i(ch2EnabledLoc, 1)
        } else {
          if (ch2EnabledLoc) gl.uniform1i(ch2EnabledLoc, 0)
        }
      }

      /**
       * Bind the current-read texture for every buffer pass as iChannel3/4/6.
       * After each buffer renders and swaps its ping-pong, readIdx points at
       * the freshly-rendered texture, so later passes (and the main shader)
       * see up-to-date data for passes that have already run this frame.
       */
      const bindBufferChannels = (prog: WebGLProgram) => {
        if (!bufs) return
        for (let b = 0; b < 3; b++) {
          const channelNum = BUFFER_CHANNEL_NUMS[b] // 3, 4, or 6
          const tex = bufs.textures[b][bufs.readIdx[b]]
          if (tex) {
            gl.activeTexture(gl.TEXTURE0 + channelNum)
            gl.bindTexture(gl.TEXTURE_2D, tex)
            const loc = gl.getUniformLocation(prog, `iChannel${channelNum}`)
            if (loc) gl.uniform1i(loc, channelNum)
          }
        }
      }

      // Re-bind VBO and vertex attribute before each draw call so state is
      // consistent regardless of which program was last used.
      const prepareGeometry = () => {
        gl.bindBuffer(gl.ARRAY_BUFFER, vboRef.current)
        gl.enableVertexAttribArray(0)
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
      }

      // ── Render each active buffer pass in order: 3 → 4 → 6 ───────────────
      if (bufs) {
        for (let b = 0; b < 3; b++) {
          const bufProg = bufs.programs[b]
          if (!bufProg) continue

          const writeIdx = 1 - bufs.readIdx[b]
          const writeFBO = bufs.fbos[b][writeIdx]
          gl.bindFramebuffer(gl.FRAMEBUFFER, writeFBO)
          gl.viewport(0, 0, w, h)
          gl.useProgram(bufProg)
          setStandardUniforms(bufProg)
          bindMediaChannels(bufProg)
          bindBufferChannels(bufProg)
          prepareGeometry()
          gl.drawArrays(gl.TRIANGLES, 0, 6)

          // Swap ping-pong: the texture just written becomes the new read texture
          bufs.readIdx[b] = writeIdx
        }
      }

      // ── Render main shader to the canvas ──────────────────────────────────
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      gl.viewport(0, 0, w, h)
      gl.useProgram(program)
      setStandardUniforms(program)
      bindMediaChannels(program)
      bindBufferChannels(program)
      prepareGeometry()
      gl.drawArrays(gl.TRIANGLES, 0, 6)

      rafRef.current = requestAnimationFrame(render)
    }

    rafRef.current = requestAnimationFrame(render)
    return () => cancelAnimationFrame(rafRef.current)
  }, [isPlaying, webcamStream, audioStream, strudelAnalyser, shaderSource, canvasRef])
}
