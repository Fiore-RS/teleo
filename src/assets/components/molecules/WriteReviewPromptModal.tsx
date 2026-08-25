import { Modal } from '../atoms/Modal'
import { Button } from '../atoms/Button'

interface WriteReviewPromptModalProps {
  isOpen: boolean
  onAccept: () => void
  onIgnore: () => void
}

/** Popup que aparece justo después de marcar un libro como terminado desde "Actualizar
 *  progreso", invitando a escribir la reseña de una vez en vez de tener que volver luego a
 *  buscarlo para reseñarlo. */
export function WriteReviewPromptModal({ isOpen, onAccept, onIgnore }: WriteReviewPromptModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onIgnore} title="¡Lo terminaste!">
      <p className="text-body-md text-text-secondary mb-5">
        ¿Quieres escribir la reseña de este libro ahora?
      </p>
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={onIgnore}>Ignorar</Button>
        <Button variant="green" className="flex-1" onClick={onAccept}>Aceptar</Button>
      </div>
    </Modal>
  )
}
