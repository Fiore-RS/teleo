import { Check, AlertTriangle, type LucideIcon } from 'lucide-react'
import { Modal } from '../atoms/Modal'
import { Button, type ButtonVariant } from '../atoms/Button'

type ActionStatus = 'confirm' | 'success' | 'error'

interface ActionConfirmModalProps {
  isOpen: boolean
  status: ActionStatus
  icon: LucideIcon
  iconVariant?: 'wishlist' | 'reading' | 'finished' | 'pending'
  confirmTitle: string
  confirmDescription: string
  confirmLabel: string
  confirmVariant?: ButtonVariant
  successTitle: string
  successDescription: string
  onConfirm: () => void
  onClose: () => void
}

const iconBg: Record<NonNullable<ActionConfirmModalProps['iconVariant']>, string> = {
  wishlist: 'bg-primary-soft text-primary-text',
  reading: 'bg-reading-soft text-accent-reading',
  finished: 'bg-finished-soft text-accent-finished',
  pending: 'bg-pending-soft text-state-pending',
}

export function ActionConfirmModal({
  isOpen, status, icon: Icon, iconVariant = 'wishlist',
  confirmTitle, confirmDescription, confirmLabel, confirmVariant = 'primary',
  successTitle, successDescription, onConfirm, onClose,
}: ActionConfirmModalProps) {
  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col items-center text-center">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
          status === 'confirm'
            ? iconBg[iconVariant]
            : status === 'success'
              ? 'bg-finished-soft text-accent-finished'
              : 'bg-reading-soft text-accent-reading'
        }`}>
          {status === 'confirm' && <Icon size={26} />}
          {status === 'success' && <Check size={28} strokeWidth={2.5} />}
          {status === 'error' && <AlertTriangle size={26} />}
        </div>

        {status === 'confirm' && (
          <>
            <h3 className="font-display font-semibold text-display-md text-text text-balance">{confirmTitle}</h3>
            <p className="text-body-md text-text-secondary mt-2">{confirmDescription}</p>
            <Button variant={confirmVariant} className="mt-5" onClick={onConfirm}>{confirmLabel}</Button>
            <Button variant="outline" className="mt-2.5" onClick={onClose}>Cancelar</Button>
          </>
        )}
        {status === 'success' && (
          <>
            <h3 className="font-display font-semibold text-display-md text-text text-balance">{successTitle}</h3>
            <p className="text-body-md text-text-secondary mt-2">{successDescription}</p>
            <Button variant="green" className="mt-5" onClick={onClose}>Entendido</Button>
          </>
        )}
        {status === 'error' && (
          <>
            <h3 className="font-display font-semibold text-display-md text-text text-balance">Algo salió mal</h3>
            <p className="text-body-md text-text-secondary mt-2">No se pudo procesar la solicitud, por favor inténtalo de nuevo.</p>
            <Button variant="primary" className="mt-5" onClick={onClose}>Entendido</Button>
          </>
        )}
      </div>
    </Modal>
  )
}