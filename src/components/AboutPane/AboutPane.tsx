import { Box, Link, Typography } from '@mui/material'
import AboutPaneSection from './AboutPaneSection'

export default function AboutPane() {
  return (
		<>
			<Box sx={{ pt: '44px' }} />
			<Box
				sx={{
					flex: 1,
					overflow: 'auto',
					p: 3,
					bgcolor: 'background.panel',
					color: 'textColor.primary',
					fontFamily: 'monospace',
					fontSize: '0.875rem',
					lineHeight: 1.7,
				}}
			>
				<AboutPaneSection>
					<Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 2 }}>
						Shades & Waves is a live-coding playground that combines real-time GLSL fragment
						shaders with{' '}
						<Link href="https://strudel.cc" target="_blank" rel="noopener noreferrer" sx={{ color: 'accent' }}>
							Strudel
						</Link>{' '}
						music patterns.
					</Typography>
				</AboutPaneSection>

				<AboutPaneSection title="License">
					<Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 2 }}>
						Shades & Waves is free/open source software: you can redistribute and/or modify it
						under the terms of the{' '}
						<Link
							href="https://www.gnu.org/licenses/agpl-3.0.html"
							target="_blank"
							rel="noopener noreferrer"
							sx={{ color: 'accent' }}
						>
							GNU Affero General Public License
						</Link>
						. You can find the source code on{' '}
						<Link
							href="https://github.com/tass-suderman/shades-and-waves"
							target="_blank"
							rel="noopener noreferrer"
							sx={{ color: 'accent' }}
						>
							GitHub
						</Link>
						.
					</Typography>
				</AboutPaneSection>

				<AboutPaneSection title="Strudel">
					<Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 2 }}>
						This app uses{' '}
						<Link href="https://strudel.cc" target="_blank" rel="noopener noreferrer" sx={{ color: 'accent' }}>
							Strudel
						</Link>{' '}
						(
						<Link
							href="https://codeberg.org/uzu/strudel"
							target="_blank"
							rel="noopener noreferrer"
							sx={{ color: 'accent' }}
						>
							source
						</Link>
						), which is free/open source software licensed under the{' '}
						<Link
							href="https://www.gnu.org/licenses/agpl-3.0.html"
							target="_blank"
							rel="noopener noreferrer"
							sx={{ color: 'accent' }}
						>
							GNU AGPL
						</Link>
						.
					</Typography>
				</AboutPaneSection>

				<AboutPaneSection title="Sound Banks">
					<Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 1 }}>
						The built-in synthesised drum and bass sounds (TR-909 and TB-303 models, ZZFX procedural sounds)
						are original implementations and carry no additional licensing requirements.
					</Typography>

					<Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 1 }}>
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
							<Typography key={href} component="li" variant="body2" sx={{ fontFamily: 'monospace' }}>
								<Link href={href} target="_blank" rel="noopener noreferrer" sx={{ color: 'accent' }}>
									{label}
								</Link>
							</Typography>
						))}
					</Box>
				</AboutPaneSection>
			</Box>
		</>
  )
}
