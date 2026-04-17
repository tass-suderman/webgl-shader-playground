import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, IconButton, FormControlLabel, Checkbox } from '@mui/material'
import { Close } from '@mui/icons-material'

interface OverwriteDialogProps {
	overwriteDialogOpen: boolean
	overwritePending: { title: string } | null
	dontShowAgain: boolean
	setDontShowAgain: (value: boolean) => void
	handleOverwriteConfirm: () => void
	handleOverwriteCancel: () => void
}

export const OverwriteDialog = ({
	overwriteDialogOpen,
	overwritePending,
	dontShowAgain,
	setDontShowAgain,
	handleOverwriteConfirm,
	handleOverwriteCancel,
}: OverwriteDialogProps) => {
  return (
    <Dialog
      open={overwriteDialogOpen}
      onClose={handleOverwriteCancel}
      maxWidth="xs"
      fullWidth
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
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Typography variant="h6" sx={{ fontFamily: 'monospace', fontSize: '1rem' }}>
          Overwrite entry?
        </Typography>
        <IconButton size="small" onClick={handleOverwriteCancel} aria-label="Close dialog" sx={{ color: 'textColor.muted' }}>
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 0 }}>
        <Typography variant="body2" sx={{ color: 'textColor.muted', fontFamily: 'monospace', mb: 1.5 }}>
          A saved entry named <strong style={{ color: 'accent' }}>{overwritePending?.title}</strong> already exists. Saving will overwrite it.
        </Typography>
        <FormControlLabel
          control={
            <Checkbox
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              size="small"
              sx={{
                color: 'border.default',
                '&.Mui-checked': { color: 'accent' },
              }}
            />
          }
          label={
            <Typography variant="body2" sx={{ color: 'textColor.muted', fontSize: '0.8rem' }}>
              Don't show this again
            </Typography>
          }
        />
      </DialogContent>
      <DialogActions sx={{ px: 2, pb: 2 }}>
        <Button
          onClick={handleOverwriteCancel}
          size="small"
          sx={{ textTransform: 'none', color: 'textColor.muted' }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleOverwriteConfirm}
          variant="contained"
          color="primary"
          size="small"
          sx={{ textTransform: 'none' }}
        >
          Overwrite
        </Button>
      </DialogActions>
    </Dialog>
  )
}
