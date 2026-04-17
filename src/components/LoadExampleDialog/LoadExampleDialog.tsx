import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, IconButton } from '@mui/material';

import CloseIcon from '@mui/icons-material/Close';

interface LoadExampleDialogProps {
	confirmOpen: boolean
	title: string
	itemLabel: string
	onCancel: () => void
	onConfirm: () => void
}

export default function LoadExampleDialog({ confirmOpen, title, itemLabel, onCancel, onConfirm }: LoadExampleDialogProps) {
	return (
      <Dialog
        open={confirmOpen}
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
						}
					}
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Typography variant="h6" sx={{ fontFamily: 'monospace', fontSize: '1rem' }}>
            Load example?
          </Typography>
          <IconButton size="small" onClick={onCancel} aria-label="Close dialog" sx={{ color: 'textColor.muted' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 0 }}>
          <Typography variant="body2" sx={{ color: 'textColor.muted', fontFamily: 'monospace' }}>
            Loading <strong style={{ color: 'accent' }}>{title}</strong> will replace
            your current {itemLabel}. Any unsaved progress will be lost.
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
            color="primary"
            size="small"
            sx={{ textTransform: 'none' }}
          >
            Load
          </Button>
        </DialogActions>
      </Dialog>
	)
}
