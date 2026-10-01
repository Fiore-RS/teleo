import { ConfirmSheet } from './ConfirmSheet'
import type { MiniBook } from './BookMiniHeader'

type ConfirmStatus = 'confirm' | 'success' | 'error'

interface ConfirmDialogProps {
  isOpen: boolean
  status: ConfirmStatus
  itemLabel: string
  /** true para palabras femeninas (cita, reseña, saga): "Esta cita". */
  feminine?: boolean
  /** Libro al que pertenece lo que se elimina, para mostrar su mini ficha. */
  book?: MiniBook | null
  onConfirm: () => void
  onClose: () => void
}

/** Confirmar una eliminación (rediseñado en la V.2.2.0, sin ícono). */
export function ConfirmDialog({ isOpen, status, itemLabel, feminine = false, book, onConfirm, onClose }: ConfirmDialogProps) {
  if (!isOpen) return null

  const este = feminine ? 'esta' : 'este'
  const eliminado = feminine ? 'eliminada' : 'eliminado'
  const capitalized = itemLabel.charAt(0).toUpperCase() + itemLabel.slice(1)

  if (status === 'success') {
    return <ConfirmSheet title={`${capitalized} ${eliminado}`} message="Ya no está en tu diario." confirmLabel="Entendido" onClose={onClose} />
  }
  if (status === 'error') {
    return <ConfirmSheet title="Algo salió mal" message="No se pudo eliminar. Inténtalo de nuevo." confirmLabel="Entendido" onClose={onClose} />
  }
  return (
    <ConfirmSheet
      title={`¿Eliminar ${este} ${itemLabel}?`}
      message="Esta acción no se puede deshacer."
      book={book}
      confirmLabel="Eliminar"
      onConfirm={onConfirm}
      onClose={onClose}
    />
  )
}
