import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, IconButton } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'

interface ConfirmationDialogProps {
	open: boolean
	heading: string
	body: React.ReactNode
	confirmLabel: string
	confirmColor?: 'primary' | 'error' | 'warning'
	onCancel: () => void
	onConfirm: () => void
}

export default function ConfirmationDialog({
	open,
	heading,
	body,
	confirmLabel,
	confirmColor = 'primary',
	onCancel,
	onConfirm,
}: ConfirmationDialogProps) {
	return (
		<Dialog
			open={open}
			onClose={onCancel}
			maxWidth="xs"
			fullWidth
			slotProps={{
				paper: {
					sx: {
						bgcolor: 'background.header',
						color: 'textColor.primary',
						borderColor: 'border.default',
						border: '1px solid',
					},
				},
			}}
		>
			<DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
				<Typography variant="h6" sx={{ fontFamily: 'monospace', fontSize: '1rem' }}>
					{heading}
				</Typography>
				<IconButton size="small" onClick={onCancel} aria-label="Close dialog" sx={{ color: 'textColor.muted' }}>
					<CloseIcon fontSize="small" />
				</IconButton>
			</DialogTitle>
			<DialogContent sx={{ pt: 0 }}>
				<Typography variant="body2" sx={{ color: 'textColor.muted', fontFamily: 'monospace' }}>
					{body}
				</Typography>
			</DialogContent>
			<DialogActions sx={{ px: 2, pb: 2 }}>
				<Button
					onClick={onCancel}
					size="small"
					sx={{ textTransform: 'none', color: 'textColor.muted' }}
				>
					Cancel
				</Button>
				<Button
					onClick={onConfirm}
					variant="contained"
					color={confirmColor}
					size="small"
					sx={{ textTransform: 'none' }}
				>
					{confirmLabel}
				</Button>
			</DialogActions>
		</Dialog>
	)
}
