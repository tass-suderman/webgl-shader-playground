import ConfirmationDialog from '../ConfirmationDialog/ConfirmationDialog'

interface LoadExampleDialogProps {
	confirmOpen: boolean
	title: string
	itemLabel: string
	onCancel: () => void
	onConfirm: () => void
	dontShowAgain?: boolean
	setDontShowAgain?: (value: boolean) => void
}

export default function LoadExampleDialog({ confirmOpen, title, itemLabel, onCancel, onConfirm, dontShowAgain, setDontShowAgain }: LoadExampleDialogProps) {
  return (
    <ConfirmationDialog
      open={confirmOpen}
      heading="Load example?"
      body={<>Loading <strong style={{ color: 'accent' }}>{title}</strong> will replace your current {itemLabel}. Any unsaved progress will be lost.</>}
      confirmLabel="Load"
      onCancel={onCancel}
      onConfirm={onConfirm}
      dontShowAgain={dontShowAgain}
      setDontShowAgain={setDontShowAgain}
    />
  )
}
