import ConfirmationDialog from '../ConfirmationDialog/ConfirmationDialog'


export interface DeleteItemDialogProps {
	open: boolean
	title: string
	onCancel: () => void
	onConfirm: () => void
}

export default function DeleteItemDialog({ open, title, onCancel, onConfirm }: DeleteItemDialogProps) {
  return (
    <ConfirmationDialog
      open={open}
      heading="Delete entry?"
      body={<>Delete <strong style={{ color: 'accent' }}>{title}</strong>? This action cannot be undone.</>}
      confirmLabel="Delete"
      confirmColor="error"
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  )
}
