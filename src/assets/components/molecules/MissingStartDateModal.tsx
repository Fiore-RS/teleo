import { StartDatePromptSheet } from './StartDatePromptSheet'
import type { MiniBook } from './BookMiniHeader'

interface MissingStartDateModalProps {
  isOpen: boolean
  book?: MiniBook | null
  onConfirm: (startDate: string) => Promise<void>
  onIgnore: () => void
}

/** Aviso al abrir "Actualizar progreso" cuando un libro que se está leyendo no tiene fecha de
 *  inicio: permite ponerla ahí mismo (arranca en hoy) o seguir sin ella. */
export function MissingStartDateModal({ isOpen, book, onConfirm, onIgnore }: MissingStartDateModalProps) {
  if (!isOpen) return null
  return (
    <StartDatePromptSheet
      title="Falta la fecha de inicio"
      message="Este libro no tiene fecha de inicio. ¿La pones ahora?"
      book={book}
      onConfirm={onConfirm}
      onDismiss={onIgnore}
    />
  )
}
