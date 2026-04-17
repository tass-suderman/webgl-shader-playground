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
  {
    label: 'TR-909 drums (synthesised)',
    sounds: ['bd909', 'sd909', 'cp909', 'ch909', 'oh909', 'rd909', 'ht909', 'lt909'],
  },
  {
    label: 'TB-303 acid bass (synthesised)',
    sounds: ['acid303'],
  },
] as const
