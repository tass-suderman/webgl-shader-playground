import { Box, Typography } from '@mui/material'

interface PaneHeaderProps {
	title?: string
	children?: React.ReactNode
}

const PaneHeader = ({ title, children }: PaneHeaderProps) => {
	return (
      <Box
        sx={{
          px: 2,
          py: 1,
          bgcolor: 'background.header',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
					borderBottom: '1px solid',
					borderColor: 'border.subtle',
					gap: 1
        }}
      >
			{
				title && 
					<Typography 
						variant="subtitle2" 
						sx={{ 
							fontFamily: 'monospace' ,
							color: 'textColor.primary'
						}} 
						children={title}
					/>
			}
				{children}
      </Box>
	)
}

export default PaneHeader
