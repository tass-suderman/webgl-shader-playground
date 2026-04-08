/**
 * Synthesized TR-909 drum sounds and TB-303 acid bass for Strudel.
 *
 * Drums registered (use with `.s()`):
 *   bd909  – bass drum (kick)
 *   sd909  – snare drum
 *   cp909  – clap
 *   ch909  – closed hi-hat
 *   oh909  – open hi-hat
 *   rd909  – ride cymbal
 *   ht909  – high tom
 *   lt909  – low tom
 *
 * Bass synth registered (use with `.s()` or `.sound()`):
 *   acid303 – sawtooth oscillator tuned to the played note.
 *             Pair with Strudel filter controls for the 303 acid sound:
 *             .cutoff(800).resonance(20).lpenv(4).lpdecay(0.2)

import { registerSound, getAudioContext, getFrequencyFromValue } from '@strudel/webaudio'

// ---------------------------------------------------------------------------
// Noise buffer cache (reuse across triggers, recreate per AudioContext)
// ---------------------------------------------------------------------------

const noiseCache = new WeakMap<AudioContext, AudioBuffer>()

function getNoiseBuffer(ctx: AudioContext): AudioBuffer {
  if (!noiseCache.has(ctx)) {
    const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
    noiseCache.set(ctx, buf)
  }
  return noiseCache.get(ctx)!
}

function noiseSource(ctx: AudioContext): AudioBufferSourceNode {
  const src = ctx.createBufferSource()
  src.buffer = getNoiseBuffer(ctx)
  return src
}

// ---------------------------------------------------------------------------
// Synthesis helpers – each returns the AudioNode to connect downstream
// ---------------------------------------------------------------------------

function synthKick(ctx: AudioContext, t: number, gain: number, out: GainNode) {
  // Pitch-swept sine (the body)
  const osc = ctx.createOscillator()
  const og = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(160, t)
  osc.frequency.exponentialRampToValueAtTime(55, t + 0.07)
  osc.frequency.exponentialRampToValueAtTime(28, t + 0.5)
  og.gain.setValueAtTime(gain * 3, t)
  og.gain.exponentialRampToValueAtTime(0.001, t + 0.5)
  osc.connect(og); og.connect(out)
  osc.start(t); osc.stop(t + 0.52)

  // Triangle transient for punch
  const osc2 = ctx.createOscillator()
  const og2 = ctx.createGain()
  osc2.type = 'triangle'
  osc2.frequency.setValueAtTime(90, t)
  osc2.frequency.exponentialRampToValueAtTime(35, t + 0.12)
  og2.gain.setValueAtTime(gain * 1.5, t)
  og2.gain.exponentialRampToValueAtTime(0.001, t + 0.13)
  osc2.connect(og2); og2.connect(out)
  osc2.start(t); osc2.stop(t + 0.14)
}

function synthSnare(ctx: AudioContext, t: number, gain: number, out: GainNode) {
  // Noise through bandpass
  const noise = noiseSource(ctx)
  const bp = ctx.createBiquadFilter()
  bp.type = 'bandpass'; bp.frequency.value = 2500; bp.Q.value = 0.7
  const ng = ctx.createGain()
  ng.gain.setValueAtTime(gain * 0.9, t)
  ng.gain.exponentialRampToValueAtTime(0.001, t + 0.18)
  noise.connect(bp); bp.connect(ng); ng.connect(out)
  noise.start(t); noise.stop(t + 0.2)

  // Tonal body
  const osc = ctx.createOscillator()
  const og = ctx.createGain()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(220, t)
  osc.frequency.exponentialRampToValueAtTime(80, t + 0.07)
  og.gain.setValueAtTime(gain * 0.7, t)
  og.gain.exponentialRampToValueAtTime(0.001, t + 0.07)
  osc.connect(og); og.connect(out)
  osc.start(t); osc.stop(t + 0.08)
}

function synthClap(ctx: AudioContext, t: number, gain: number, out: GainNode) {
  const bursts = [0, 0.011, 0.024, 0.042]
  bursts.forEach((offset, i) => {
    const noise = noiseSource(ctx)
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'; bp.frequency.value = 1400; bp.Q.value = 0.9
    const g = ctx.createGain()
    const isLast = i === bursts.length - 1
    const dur = isLast ? 0.14 : 0.025
    g.gain.setValueAtTime(gain * (isLast ? 0.55 : 0.9), t + offset)
    g.gain.exponentialRampToValueAtTime(0.001, t + offset + dur)
    noise.connect(bp); bp.connect(g); g.connect(out)
    noise.start(t + offset); noise.stop(t + offset + dur + 0.01)
  })
}

function synthHiHat(ctx: AudioContext, t: number, gain: number, open: boolean, out: GainNode) {
  const noise = noiseSource(ctx)
  const hp = ctx.createBiquadFilter()
  hp.type = 'highpass'; hp.frequency.value = 8500
  const g = ctx.createGain()
  const dur = open ? 0.3 : 0.048
  g.gain.setValueAtTime(gain * 0.55, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + dur)
  noise.connect(hp); hp.connect(g); g.connect(out)
  noise.start(t); noise.stop(t + dur + 0.01)
}

function synthRide(ctx: AudioContext, t: number, gain: number, out: GainNode) {
  // High-frequency noise shimmer
  const noise = noiseSource(ctx)
  const hp = ctx.createBiquadFilter()
  hp.type = 'highpass'; hp.frequency.value = 10000
  const ng = ctx.createGain()
  ng.gain.setValueAtTime(gain * 0.18, t)
  ng.gain.exponentialRampToValueAtTime(0.001, t + 1.0)
  noise.connect(hp); hp.connect(ng); ng.connect(out)
  noise.start(t); noise.stop(t + 1.02)

  // Metallic partials
  const partials = [251, 399, 537, 801, 1101]
  partials.forEach(freq => {
    const osc = ctx.createOscillator()
    const og = ctx.createGain()
    osc.type = 'square'; osc.frequency.value = freq
    og.gain.setValueAtTime(gain * 0.04, t)
    og.gain.exponentialRampToValueAtTime(0.001, t + 1.1)
    osc.connect(og); og.connect(out)
    osc.start(t); osc.stop(t + 1.12)
  })
}

function synthTom(ctx: AudioContext, t: number, gain: number, hi: boolean, out: GainNode) {
  const osc = ctx.createOscillator()
  const og = ctx.createGain()
  osc.type = 'sine'
  const [sf, ef, dur] = hi ? [420, 260, 0.16] : [260, 140, 0.22]
  osc.frequency.setValueAtTime(sf, t)
  osc.frequency.exponentialRampToValueAtTime(ef, t + dur)
  og.gain.setValueAtTime(gain * 1.6, t)
  og.gain.exponentialRampToValueAtTime(0.001, t + dur)
  osc.connect(og); og.connect(out)
  osc.start(t); osc.stop(t + dur + 0.01)
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

type StrudelValue = Record<string, unknown>

/** Return a GainNode wired as the output tap for a drum voice. */
function makeDrumOut(ctx: AudioContext, gain: number): GainNode {
  const out = ctx.createGain()
  out.gain.value = gain
  return out
}

export function registerInstruments() {
  // ── TR-909 bass drum ─────────────────────────────────────────────────────
  registerSound(
    'bd909',
    (time: number, value: StrudelValue, onended: () => void) => {
      const ctx = getAudioContext()
      if (!ctx) { onended(); return }
      const gain = (value.gain as number) ?? 1
      const out = makeDrumOut(ctx, 1)
      synthKick(ctx, time, gain, out)
      setTimeout(onended, 600)
      return { node: out }
    },
    { type: 'synth', prebake: true },
  )

  // ── TR-909 snare drum ────────────────────────────────────────────────────
  registerSound(
    'sd909',
    (time: number, value: StrudelValue, onended: () => void) => {
      const ctx = getAudioContext()
      if (!ctx) { onended(); return }
      const gain = (value.gain as number) ?? 1
      const out = makeDrumOut(ctx, 1)
      synthSnare(ctx, time, gain, out)
      setTimeout(onended, 280)
      return { node: out }
    },
    { type: 'synth', prebake: true },
  )

  // ── TR-909 clap ──────────────────────────────────────────────────────────
  registerSound(
    'cp909',
    (time: number, value: StrudelValue, onended: () => void) => {
      const ctx = getAudioContext()
      if (!ctx) { onended(); return }
      const gain = (value.gain as number) ?? 1
      const out = makeDrumOut(ctx, 1)
      synthClap(ctx, time, gain, out)
      setTimeout(onended, 250)
      return { node: out }
    },
    { type: 'synth', prebake: true },
  )

  // ── TR-909 closed hi-hat ─────────────────────────────────────────────────
  registerSound(
    'ch909',
    (time: number, value: StrudelValue, onended: () => void) => {
      const ctx = getAudioContext()
      if (!ctx) { onended(); return }
      const gain = (value.gain as number) ?? 1
      const out = makeDrumOut(ctx, 1)
      synthHiHat(ctx, time, gain, false, out)
      setTimeout(onended, 120)
      return { node: out }
    },
    { type: 'synth', prebake: true },
  )

  // ── TR-909 open hi-hat ───────────────────────────────────────────────────
  registerSound(
    'oh909',
    (time: number, value: StrudelValue, onended: () => void) => {
      const ctx = getAudioContext()
      if (!ctx) { onended(); return }
      const gain = (value.gain as number) ?? 1
      const out = makeDrumOut(ctx, 1)
      synthHiHat(ctx, time, gain, true, out)
      setTimeout(onended, 400)
      return { node: out }
    },
    { type: 'synth', prebake: true },
  )

  // ── TR-909 ride cymbal ───────────────────────────────────────────────────
  registerSound(
    'rd909',
    (time: number, value: StrudelValue, onended: () => void) => {
      const ctx = getAudioContext()
      if (!ctx) { onended(); return }
      const gain = (value.gain as number) ?? 1
      const out = makeDrumOut(ctx, 1)
      synthRide(ctx, time, gain, out)
      setTimeout(onended, 1200)
      return { node: out }
    },
    { type: 'synth', prebake: true },
  )

  // ── TR-909 high tom ──────────────────────────────────────────────────────
  registerSound(
    'ht909',
    (time: number, value: StrudelValue, onended: () => void) => {
      const ctx = getAudioContext()
      if (!ctx) { onended(); return }
      const gain = (value.gain as number) ?? 1
      const out = makeDrumOut(ctx, 1)
      synthTom(ctx, time, gain, true, out)
      setTimeout(onended, 250)
      return { node: out }
    },
    { type: 'synth', prebake: true },
  )

  // ── TR-909 low tom ───────────────────────────────────────────────────────
  registerSound(
    'lt909',
    (time: number, value: StrudelValue, onended: () => void) => {
      const ctx = getAudioContext()
      if (!ctx) { onended(); return }
      const gain = (value.gain as number) ?? 1
      const out = makeDrumOut(ctx, 1)
      synthTom(ctx, time, gain, false, out)
      setTimeout(onended, 320)
      return { node: out }
    },
    { type: 'synth', prebake: true },
  )

  // ── TB-303 acid bass ─────────────────────────────────────────────────────
  // Sawtooth oscillator pitched to the hap note.
  // Apply the acid filter in your pattern with Strudel controls:
  //   .cutoff(800).resonance(20).lpenv(4).lpdecay(0.15)
  registerSound(
    'acid303',
    (time: number, value: StrudelValue, onended: () => void) => {
      const ctx = getAudioContext()
      if (!ctx) { onended(); return }

      const freq = getFrequencyFromValue(value) ?? 110
      const dur = (value.duration as number) ?? 0.25
      const gain = (value.gain as number) ?? 1

      const osc = ctx.createOscillator()
      const out = ctx.createGain()

      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(freq, time)

      // Slight amplitude envelope – instant on, short off
      out.gain.setValueAtTime(gain, time)
      out.gain.setValueAtTime(gain, time + Math.max(dur - 0.02, 0.01))
      out.gain.linearRampToValueAtTime(0, time + dur + 0.01)

      osc.connect(out)
      osc.start(time)
      osc.stop(time + dur + 0.05)

      setTimeout(onended, (dur + 0.1) * 1000)
      return {
        node: out,
        nodes: { source: [osc] },
        stop: (releaseTime: number) => { osc.stop(releaseTime + 0.01) },
      }
    },
    { type: 'synth', prebake: true },
  )
}
