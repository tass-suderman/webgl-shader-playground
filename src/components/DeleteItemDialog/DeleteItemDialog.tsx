import { Button, Dialog, DialogActions, DialogTitle, DialogContent, IconButton, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';


export interface DeleteItemDialogProps {
	open: boolean
	title: string
	onCancel: () => void
	onConfirm: () => void
}

export default function DeleteItemDialog({ open, title, onCancel, onConfirm }: DeleteItemDialogProps) {
	return (
      <Dialog
        open={open}
        onClose={onCancel}
        maxWidth="xs"
        fullWidth
        slotProps={{
					paper:{
						sx: {
							bgcolor: 'background.header',
							color: 'textColor.primary',
							border: '1px solid',
							borderColor: 'border.default',
						},
					}
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Typography variant="h6" sx={{ fontFamily: 'monospace', fontSize: '1rem' }}>
            Delete entry?
          </Typography>
          <IconButton size="small" onClick={onCancel} aria-label="Close dialog" sx={{ color: 'textColor.muted' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 0 }}>
          <Typography variant="body2" sx={{ color: 'textColor.muted', fontFamily: 'monospace' }}>
            Delete <strong style={{ color: 'accent' }}>{title}</strong>? This action cannot be undone.
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
            color="error"
            size="small"
            sx={{ textTransform: 'none' }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
	)
}
