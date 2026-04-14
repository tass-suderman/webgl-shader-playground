import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { SOUND_CATEGORIES } from './soundCategories'
import { InformationPanel } from '../informationPanel/InformationPanel'

/** Inline sounds reference panel – shown in-pane instead of a modal. */
export default function SoundsPanel() {
	const renderCategory = (cat: any) => (
		<Box key={cat.label} sx={{ mb: 2 }}>
			<Typography
				variant="caption"
				sx={{
					color: 'textColor.muted',
					textTransform: 'uppercase',
				}}
			>
				{cat.label}
			</Typography>
			<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
				{cat.sounds.map((s: string) => (
					<Typography
						key={s}
						component="code"
						sx={{
							bgcolor: 'background.button',
							px: 0.75,
							py: 0.25,
							borderRadius: 0.5,
							fontSize: '0.8rem',
							fontFamily: 'monospace',
							color: '#9cdcfe',
						}}
					>
						{s}
					</Typography>
				))}
			</Box>
			{cat.aliases && Object.keys(cat.aliases).length > 0 && (
				<Typography
					variant="caption"
					sx={{
						color: 'textColor.muted',
						display: 'block',
						mt: 0.5,
					}}
				>
					Aliases: {Object.entries(cat.aliases).map(([a, b]) => `${a} → ${b}`).join(', ')}
				</Typography>
			)}
		</Box>
	)

		
  return (
		<InformationPanel
			renderer={renderCategory}
			items={SOUND_CATEGORIES}
			footer={(
				<Typography
					variant="caption"
					sx={{ color: 'textColor.muted', display: 'block', mt: 1 }}
				>
          Use with <code style={{ color: '#9cdcfe' }}>.sound("name")</code> in your pattern.
      	</Typography>
			)}
		/>
  )
}
