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
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0))
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
    (time, value, onended) => {
      const ctx = getAudioContext()
      if (!ctx) { onended(); return }

      const cached = bufferCache.get(sample.id)
      if (cached && cached.ctx === ctx) {
        const buffer = cached.buffer

        // Read playback parameters from the Strudel hap value
        const speed = typeof value.speed === 'number' ? value.speed : 1
        const begin = typeof value.begin === 'number' ? Math.max(0, Math.min(1, value.begin)) : 0
        const end = typeof value.end === 'number' ? Math.max(0, Math.min(1, value.end)) : 1
        const gain = typeof value.gain === 'number' ? value.gain : 1
        const loop = Boolean(value.loop)

        const source = ctx.createBufferSource()
        source.buffer = buffer
        // Web Audio API does not support negative playbackRate on BufferSourceNode;
        // use Math.abs so patterns using negative speed values don't throw.
        source.playbackRate.value = Math.abs(speed)
        source.loop = loop

        // Convert begin/end fractions to buffer-time seconds for source.start()
        const offset = begin * buffer.duration
        const playDuration = Math.max(0, end - begin) * buffer.duration
        // Only set loop bounds when the range is valid (loopStart must be < loopEnd)
        if (loop && playDuration > 0) {
          source.loopStart = offset
          source.loopEnd = offset + playDuration
        }

        const out = ctx.createGain()
        out.gain.value = gain
        source.connect(out)
        source.onended = onended
        source.start(time, offset, loop ? undefined : playDuration)
        return {
          node: out,
          stop: (releaseTime: number) => {
            try { source.stop(releaseTime) } catch { /* already stopped */ }
          },
        }
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
