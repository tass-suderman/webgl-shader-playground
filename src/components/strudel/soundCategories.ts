// ---------------------------------------------------------------------------
// Sounds reference data – available sound names grouped by category
// ---------------------------------------------------------------------------

export interface SoundCategory {
  label: string
  sounds: readonly string[]
  aliases?: Record<string, string>
}

export const SOUND_CATEGORIES: readonly SoundCategory[] = [
  {
    label: 'Oscillator waveforms',
    sounds: ['sine', 'sawtooth', 'square', 'triangle'],
    aliases: { sin: 'sine', saw: 'sawtooth', sqr: 'square', tri: 'triangle' },
  },
  {
    label: 'Synth voices',
    sounds: ['sbd', 'supersaw', 'bytebeat', 'pulse', 'bus', 'user', 'one'],
    aliases: { bd: 'sbd' },
  },
  {
    label: 'Noise',
    sounds: ['pink', 'white', 'brown', 'crackle'],
  },
  {
    label: 'ZZFX (procedural)',
    sounds: ['zzfx', 'z_sine', 'z_sawtooth', 'z_triangle', 'z_square', 'z_tan', 'z_noise'],
  },
] as const
