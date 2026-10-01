import { ConfirmSheet } from './ConfirmSheet'
import type { ButtonVariant } from '../atoms/Button'

type ActionStatus = 'confirm' | 'success' | 'error'

interface ActionConfirmModalProps {
  isOpen: boolean
  status: ActionStatus
  confirmTitle: string
  confirmDescription: string
  confirmLabel: string
  confirmVariant?: ButtonVariant
  successTitle: string
  successDescription: string
  onConfirm: () => void
  onClose: () => void
}

/** Confirmar una acción de Configuración (exportar, importar, vaciar). Rediseñado en la
 *  V.2.2.0 sobre `ConfirmSheet`, sin ícono. */
export function ActionConfirmModal({
  isOpen, status,
  confirmTitle, confirmDescription, confirmLabel, confirmVariant = 'primary',
  successTitle, successDescription, onConfirm, onClose,
}: ActionConfirmModalProps) {
  if (!isOpen) return null

  if (status === 'success') {
    return <ConfirmSheet title={successTitle} message={successDescription} confirmLabel="Entendido" onClose={onClose} />
  }
  if (status === 'error') {
    return <ConfirmSheet title="Algo salió mal" message="No se pudo completar. Inténtalo de nuevo." confirmLabel="Entendido" onClose={onClose} />
  }
  return (
    <ConfirmSheet
      title={confirmTitle}
      message={confirmDescription}
      confirmLabel={confirmLabel}
      confirmVariant={confirmVariant}
      onConfirm={onConfirm}
      onClose={onClose}
    />
  )
}
