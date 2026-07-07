import { Dialog } from '@base-ui/react/dialog'
import { COLORS } from '@/constants'

interface ConfirmDeleteDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  description?: string
}

export function ConfirmDeleteDialog({
  open,
  onClose,
  onConfirm,
  title = 'Sei sicuro di voler eliminare il piatto?',
  description = 'Questa azione non è reversibile. Cancellerai permanentemente il piatto.',
}: ConfirmDeleteDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Popup className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-xl shadow-xl p-8 flex flex-col gap-4">
          <Dialog.Title className="text-xl font-semibold" style={{ color: COLORS.text }}>
            {title}
          </Dialog.Title>
          <Dialog.Description className="text-base text-gray-500">
            {description}
          </Dialog.Description>
          <div className="flex justify-end gap-3 mt-2">
            <Dialog.Close render={
              <button
                className="h-10 px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 text-base font-medium transition-colors"
                style={{ color: COLORS.text }}
              >
                Annulla
              </button>
            } />
            <button
              className="h-10 px-4 py-2 rounded-md text-white text-base font-medium transition-opacity hover:opacity-80"
              style={{ backgroundColor: COLORS.accent }}
              onClick={onConfirm}
            >
              Elimina
            </button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
