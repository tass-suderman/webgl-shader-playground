// ---------------------------------------------------------------------------
// Sounds reference data – available sound names grouped by category
// ---------------------------------------------------------------------------

export interface SoundCategory {
  label: string
  sounds: readonly string[]
  aliases?: Record<string, string>
  note?: string
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
  },
  {
    label: 'Noise',
    sounds: ['pink', 'white', 'brown', 'crackle'],
  },
  {
    label: 'ZZFX (procedural)',
    sounds: ['zzfx', 'z_sine', 'z_sawtooth', 'z_triangle', 'z_square', 'z_tan', 'z_noise'],
  },
  // ---------------------------------------------------------------------------
  // Drum samples – loaded automatically on first play (requires internet).
  // Use with s("name") or .sound("name"), e.g. s("RolandTR808_bd RolandTR808_sd RolandTR808_hh").
  // Short aliases (TR808_*, LM1_*, etc.) also work when the aliasBank loads.
  // ---------------------------------------------------------------------------
  {
    label: 'Drums — generic (uzu-drumkit)',
    sounds: ['bd', 'sn', 'hh', 'oh', 'cp', 'cr', 'brk', 'cb', 'lt', 'mt', 'ht'],
    note: 'Loaded from tidalcycles/uzu-drumkit on first play.',
  },
  {
    label: 'Roland TR-808',
    sounds: [
      'RolandTR808_bd', 'RolandTR808_sd', 'RolandTR808_hh', 'RolandTR808_oh',
      'RolandTR808_cp', 'RolandTR808_cr', 'RolandTR808_lt', 'RolandTR808_mt', 'RolandTR808_ht',
      'RolandTR808_rim', 'RolandTR808_cb', 'RolandTR808_sh', 'RolandTR808_perc',
    ],
    note: 'Short alias: TR808_* (requires aliasBank)',
  },
  {
    label: 'Roland TR-909',
    sounds: [
      'RolandTR909_bd', 'RolandTR909_sd', 'RolandTR909_hh', 'RolandTR909_oh',
      'RolandTR909_cp', 'RolandTR909_cr', 'RolandTR909_lt', 'RolandTR909_mt', 'RolandTR909_ht',
      'RolandTR909_rd', 'RolandTR909_rim',
    ],
    note: 'Short alias: TR909_* (requires aliasBank)',
  },
  {
    label: 'Roland TR-606 & TR-707',
    sounds: [
      'RolandTR606_bd', 'RolandTR606_sd', 'RolandTR606_hh', 'RolandTR606_oh', 'RolandTR606_cr', 'RolandTR606_lt', 'RolandTR606_ht',
      'RolandTR707_bd', 'RolandTR707_sd', 'RolandTR707_hh', 'RolandTR707_oh', 'RolandTR707_cp', 'RolandTR707_cr',
      'RolandTR707_lt', 'RolandTR707_mt', 'RolandTR707_ht', 'RolandTR707_rim', 'RolandTR707_cb',
    ],
    note: 'Short aliases: TR606_* / TR707_* (require aliasBank)',
  },
  {
    label: 'Linn LM-1 & Oberheim DMX',
    sounds: [
      'LinnLM1_bd', 'LinnLM1_sd', 'LinnLM1_hh', 'LinnLM1_oh', 'LinnLM1_cp',
      'LinnLM1_lt', 'LinnLM1_ht', 'LinnLM1_rim', 'LinnLM1_cb', 'LinnLM1_perc',
      'OberheimDMX_bd', 'OberheimDMX_sd', 'OberheimDMX_hh', 'OberheimDMX_oh', 'OberheimDMX_cp', 'OberheimDMX_cr',
      'OberheimDMX_lt', 'OberheimDMX_mt', 'OberheimDMX_ht', 'OberheimDMX_rd', 'OberheimDMX_rim',
    ],
    note: 'Short aliases: LM1_* / DMX_* (require aliasBank)',
  },
  {
    label: 'More classic machines',
    sounds: [
      'BossDR55_bd', 'BossDR55_sd', 'BossDR55_hh', 'BossDR55_cp',
      'BossDR110_bd', 'BossDR110_sd', 'BossDR110_hh', 'BossDR110_oh', 'BossDR110_cp',
      'KorgKR55_bd', 'KorgKR55_sd', 'KorgKR55_hh',
      'KorgMinipops_bd', 'KorgMinipops_sd', 'KorgMinipops_hh',
      'AkaiMPC60_bd', 'AkaiMPC60_sd', 'AkaiMPC60_hh', 'AkaiMPC60_oh', 'AkaiMPC60_cp',
      'RolandR8_bd', 'RolandR8_sd', 'RolandR8_hh', 'RolandR8_oh', 'RolandR8_cp', 'RolandR8_cr', 'RolandR8_rim',
    ],
    note: 'Short aliases: DR55_* / DR110_* / KR55_* / Minipops_* / MPC60_* / R8_* (require aliasBank)',
  },
] as const
