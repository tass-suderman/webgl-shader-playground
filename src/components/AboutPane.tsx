import Box from '@mui/material/Box'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'

export default function AboutPane() {
  return (
    <Box
      sx={{
        flex: 1,
        overflow: 'auto',
        p: 3,
        bgcolor: 'var(--pg-bg-panel)',
        color: 'var(--pg-text-primary)',
        fontFamily: 'monospace',
        fontSize: '0.875rem',
        lineHeight: 1.7,
      }}
    >
      <Typography variant="h6" sx={{ fontFamily: 'monospace', mb: 2, color: 'var(--pg-text-primary)' }}>
        About Shades & Waves
      </Typography>

      <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 2, color: 'var(--pg-text-primary)' }}>
        Shades &amp; Waves is a live-coding playground that combines real-time GLSL fragment
        shaders with{' '}
        <Link href="https://strudel.cc" target="_blank" rel="noopener noreferrer" sx={{ color: 'var(--pg-accent)' }}>
          Strudel
        </Link>{' '}
        music patterns.
      </Typography>

      <Typography variant="h6" sx={{ fontFamily: 'monospace', mt: 3, mb: 1, fontSize: '0.95rem', color: 'var(--pg-text-primary)' }}>
        License
      </Typography>

      <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 2, color: 'var(--pg-text-primary)' }}>
        Shades &amp; Waves is free/open source software: you can redistribute and/or modify it
        under the terms of the{' '}
        <Link
          href="https://www.gnu.org/licenses/agpl-3.0.html"
          target="_blank"
          rel="noopener noreferrer"
          sx={{ color: 'var(--pg-accent)' }}
        >
          GNU Affero General Public License
        </Link>
        . You can find the source code on{' '}
        <Link
          href="https://github.com/tass-suderman/shades-and-waves"
          target="_blank"
          rel="noopener noreferrer"
          sx={{ color: 'var(--pg-accent)' }}
        >
          GitHub
        </Link>
        .
      </Typography>

      <Typography variant="h6" sx={{ fontFamily: 'monospace', mt: 3, mb: 1, fontSize: '0.95rem', color: 'var(--pg-text-primary)' }}>
        Strudel
      </Typography>

      <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 2, color: 'var(--pg-text-primary)' }}>
        This app uses{' '}
        <Link href="https://strudel.cc" target="_blank" rel="noopener noreferrer" sx={{ color: 'var(--pg-accent)' }}>
          Strudel
        </Link>{' '}
        (
        <Link
          href="https://codeberg.org/uzu/strudel"
          target="_blank"
          rel="noopener noreferrer"
          sx={{ color: 'var(--pg-accent)' }}
        >
          source
        </Link>
        ), which is free/open source software licensed under the{' '}
        <Link
          href="https://www.gnu.org/licenses/agpl-3.0.html"
          target="_blank"
          rel="noopener noreferrer"
          sx={{ color: 'var(--pg-accent)' }}
        >
          GNU AGPL
        </Link>
        .
      </Typography>

      <Typography variant="h6" sx={{ fontFamily: 'monospace', mt: 3, mb: 1, fontSize: '0.95rem', color: 'var(--pg-text-primary)' }}>
        Sound Banks
      </Typography>

      <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 1, color: 'var(--pg-text-primary)' }}>
        The built-in synthesised drum and bass sounds (TR-909 and TB-303 models, ZZFX procedural sounds)
        are original implementations and carry no additional licensing requirements.
      </Typography>

      <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 1, color: 'var(--pg-text-primary)' }}>
        When Strudel&apos;s default sample banks load successfully they may include samples from the
        following sources. Please refer to their respective repositories for licensing details:
      </Typography>

      <Box component="ul" sx={{ pl: 3, mb: 2 }}>
        {[
          {
            label: 'Dirt-Samples',
            href: 'https://github.com/tidalcycles/Dirt-Samples',
          },
          {
            label: 'dough-samples (piano, vcsl, mridangam, tidal-drum-machines)',
            href: 'https://github.com/felixroos/dough-samples',
          },
          {
            label: 'uzu-drumkit',
            href: 'https://github.com/tidalcycles/uzu-drumkit',
          },
        ].map(({ label, href }) => (
          <Typography key={href} component="li" variant="body2" sx={{ fontFamily: 'monospace', color: 'var(--pg-text-primary)' }}>
            <Link href={href} target="_blank" rel="noopener noreferrer" sx={{ color: 'var(--pg-accent)' }}>
              {label}
            </Link>
          </Typography>
        ))}
      </Box>
    </Box>
  )
}
