import ConfirmationDialog from '../ConfirmationDialog/ConfirmationDialog'

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
    <ConfirmationDialog
      open={overwriteDialogOpen}
      heading="Overwrite entry?"
      body={<>A saved entry named <strong style={{ color: 'accent' }}>{overwritePending?.title}</strong> already exists. Saving will overwrite it.</>}
      confirmLabel="Overwrite"
      onCancel={handleOverwriteCancel}
      onConfirm={handleOverwriteConfirm}
      dontShowAgain={dontShowAgain}
      setDontShowAgain={setDontShowAgain}
    />
  )
}
