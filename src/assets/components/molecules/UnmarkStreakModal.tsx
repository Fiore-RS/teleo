import { ConfirmSheet } from './ConfirmSheet'

interface UnmarkStreakModalProps {
  isOpen: boolean
  onConfirm: () => void
  onDismiss: () => void
}

/** Confirmación antes de desmarcar la sesión de lectura de hoy, por si se tocó "Sesión de
 *  hoy marcada" sin querer (rediseñado en la V.2.2.0, sin ícono). */
export function UnmarkStreakModal({ isOpen, onConfirm, onDismiss }: UnmarkStreakModalProps) {
  if (!isOpen) return null
  return (
    <ConfirmSheet
      title="¿Quitar hoy de tu racha?"
      message="Por si lo marcaste sin querer."
      confirmLabel="Quitar"
      confirmVariant="orange"
      cancelLabel="Déjalo"
      onConfirm={onConfirm}
      onClose={onDismiss}
    />
  )
}
