import { Box, IconButton, SxProps } from '@mui/material'
import { Menu, Close } from '@mui/icons-material'

export interface MobileMenuIconPillProps {
	sx: SxProps,
	setOpen: React.Dispatch<React.SetStateAction<boolean>>
	open: boolean
}

const MobileMenuIconPill = ({ sx, setOpen, open }: MobileMenuIconPillProps) => {
  return (
    <Box sx={{ ...sx, pointerEvents: 'auto', px: 0.5 }}>
      <IconButton
        size="small"
        onClick={() => setOpen(v => !v)}
        sx={{ color: 'white', p: 0.5 }}
        aria-label={open ? 'Close menu' : 'Open menu'}
        children={open ? <Close fontSize="small" /> : <Menu fontSize="small" />}
      />
    </Box>
  )
}


export default MobileMenuIconPill
