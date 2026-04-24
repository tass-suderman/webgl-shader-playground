import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';

interface ResetConfirmationDialogProps {
	open: boolean
	onCancel: () => void
	onConfirm: () => void
}

export default function ResetConfirmationDialog({ open, onCancel, onConfirm }: ResetConfirmationDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      slotProps={{
        paper: {
          sx: {
            bgcolor: 'background.header',
            color: 'textColor.primary',
            border: '1px solid',
            borderColor: 'border.default',
          },
        }
      }}
    >
      <DialogTitle sx={{ color: 'textColor.primary' }}>Reset all data?</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ color: 'textColor.muted' }}>
            This will permanently delete all saved shaders, patterns, and preferences — including all entries in the Saved Content section. The page will
            reload and everything will return to its default state. This action cannot be undone.
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={onCancel}
          sx={{ color: 'textColor.muted', textTransform: 'none' }}
        >
            Cancel
        </Button>
        <Button
          onClick={onConfirm}
          color="error"
          variant="contained"
          sx={{ textTransform: 'none' }}
        >
            Reset
        </Button>
      </DialogActions>
    </Dialog>
  )}
