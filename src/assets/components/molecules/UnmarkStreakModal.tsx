import { Modal } from '../atoms/Modal'
import { Button } from '../atoms/Button'

interface UnmarkStreakModalProps {
  isOpen: boolean
  onConfirm: () => void
  onDismiss: () => void
}

/** Popup de confirmación antes de desmarcar la sesión de lectura de hoy — por si se le dio
 *  click por accidente al botón "Sesión de hoy marcada" estando en la pestaña de Mesa. */
export function UnmarkStreakModal({ isOpen, onConfirm, onDismiss }: UnmarkStreakModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onDismiss} title="Un momento...">
      <p className="text-body-md text-text-secondary mb-5">
        ¿Deseas quitar hoy de tu racha de lectura?
      </p>
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={onDismiss}>No</Button>
        <Button variant="green" className="flex-1" onClick={onConfirm}>Sí</Button>
      </div>
    </Modal>
  )
}
