import { registerSound, getAudioContext } from '@strudel/webaudio'
import { UserSample } from '../../hooks/useAppStorage'

// ---------------------------------------------------------------------------
// Buffer cache: sampleId → decoded AudioBuffer (per AudioContext)
// ---------------------------------------------------------------------------

interface CachedBuffer {
  ctx: AudioContext
  buffer: AudioBuffer
}

const bufferCache = new Map<string, CachedBuffer>()

async function decodeUserSample(sample: UserSample): Promise<AudioBuffer | null> {
  const ctx = getAudioContext()
  if (!ctx) return null

  const cached = bufferCache.get(sample.id)
  if (cached && cached.ctx === ctx) return cached.buffer

  try {
    const binary = atob(sample.audioData)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    // slice(0) so decodeAudioData gets its own detached copy
    const buffer = await ctx.decodeAudioData(bytes.buffer.slice(0))
    bufferCache.set(sample.id, { ctx, buffer })
    return buffer
  } catch (err) {
    console.error(`[shades-and-waves] Failed to decode sample: ${sample.fileName}`, err)
    return null
  }
}

/**
 * Register a user-uploaded sample with Strudel so it can be used via
 * `.sound("title")` in patterns. Call this whenever a sample is added or
 * its title changes.
 */
export function registerUserSampleSound(sample: UserSample): void {
  registerSound(
    sample.title,
    (time, _value, onended) => {
      const ctx = getAudioContext()
      if (!ctx) { onended(); return }

      const cached = bufferCache.get(sample.id)
      if (cached && cached.ctx === ctx) {
        const source = ctx.createBufferSource()
        source.buffer = cached.buffer
        const out = ctx.createGain()
        out.gain.value = 1
        source.connect(out)
        source.onended = onended
        source.start(time)
        return { node: out }
      }

      // Buffer not yet decoded – kick off decoding and call onended so
      // Strudel doesn't hang. The sound will be ready on the next trigger.
      decodeUserSample(sample).catch(console.error)
      onended()
    },
    { type: 'sample', prebake: false },
  )
}

/**
 * Pre-decode all stored sample buffers once the AudioContext is available.
 * Call this after the first user interaction that initialises the context.
 */
export function preloadUserSamples(samples: UserSample[]): void {
  for (const sample of samples) {
    decodeUserSample(sample).catch(console.error)
  }
}
