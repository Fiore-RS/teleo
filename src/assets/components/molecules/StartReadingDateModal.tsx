import { StartDatePromptSheet } from './StartDatePromptSheet'
import type { MiniBook } from './BookMiniHeader'

interface StartReadingDateModalProps {
  isOpen: boolean
  book?: MiniBook | null
  /** Se guarda esa fecha como inicio de la lectura (hoy, o la que se eligió). */
  onConfirm: (startDate: string) => void
  /** "Ahora no": se guarda el cambio de estado sin tocar la fecha de inicio. */
  onDismiss: () => void
}

/** "¡A leer!": aparece al marcar un libro como Leyendo (Retomar lectura, Leer de nuevo, el
 *  menú de estado, Empezar a leer...) para poner la fecha de inicio. Arranca en hoy y se puede
 *  cambiar (V.2.2.0; antes solo preguntaba sí o no a usar hoy). */
export function StartReadingDateModal({ isOpen, book, onConfirm, onDismiss }: StartReadingDateModalProps) {
  if (!isOpen) return null
  return (
    <StartDatePromptSheet
      title="¡A leer!"
      message="¿Desde cuándo lo estás leyendo? Así tu racha y tu ritmo salen bien."
      book={book}
      onConfirm={onConfirm}
      onDismiss={onDismiss}
    />
  )
}
