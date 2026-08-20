import { Modal } from '../atoms/Modal'
import { Button } from '../atoms/Button'

interface StartReadingDateModalProps {
  isOpen: boolean
  /** El usuario eligió "Sí" — se debe guardar hoy como fecha de inicio. */
  onConfirm: () => void
  /** El usuario eligió "No" — se guarda el cambio de estado sin tocar la fecha de inicio. */
  onDismiss: () => void
}

/** Popup que aparece al marcar un libro con el estado "leyendo" (desde "Retomar Lectura" o
 *  desde el selector de Estado al editar un libro), para ofrecer completar la fecha de inicio
 *  de lectura automáticamente con el día de hoy, en vez de dejarla vacía. */
export function StartReadingDateModal({ isOpen, onConfirm, onDismiss }: StartReadingDateModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onDismiss} title="¡A leer!">
      <p className="text-body-md text-text-secondary mb-5">
        ¿Quieres establecer hoy como la fecha de inicio de tu lectura?
      </p>
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={onDismiss}>No</Button>
        <Button variant="green" className="flex-1" onClick={onConfirm}>Sí</Button>
      </div>
    </Modal>
  )
}
