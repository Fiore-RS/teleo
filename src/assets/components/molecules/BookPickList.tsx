import type { ReactNode } from 'react'
import { MiniCover } from '../atoms/MiniCover'
import { FormCard } from './FormLayout'

export interface PickBook {
  id: string
  title: string
  author?: string | null
  cover_url?: string | null
}

interface BookPickListProps<T extends PickBook> {
  books: T[]
  onPick: (book: T) => void
  /** Lo que va a la derecha de cada fila (flecha, círculo con el orden, ✓). */
  trailing?: (book: T) => ReactNode
  /** Filas marcadas con fondo rubor. */
  isSelected?: (book: T) => boolean
}

/** Lista de libros para elegir (V.2.2.0): una tarjeta con filas compactas (portada chica,
 *  título y autor). La usan los selectores de libros de saga, reseña y compartir. */
export function BookPickList<T extends PickBook>({ books, onPick, trailing, isSelected }: BookPickListProps<T>) {
  return (
    <FormCard className="overflow-hidden">
      {books.map((book) => {
        const selected = isSelected?.(book) ?? false
        return (
          <button
            key={book.id}
            type="button"
            onClick={() => onPick(book)}
            aria-pressed={isSelected ? selected : undefined}
            className={`w-full flex gap-3 items-center px-3 py-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-text ${
              selected ? 'bg-primary-soft' : ''
            }`}
          >
            <MiniCover src={book.cover_url} title={book.title} className="w-8.5" />
            <span className="flex-1 min-w-0">
              <span className="block font-body font-semibold text-body-md text-text truncate">{book.title}</span>
              {book.author && <span className="block text-body-sm text-text-secondary truncate">{book.author}</span>}
            </span>
            {trailing?.(book)}
          </button>
        )
      })}
    </FormCard>
  )
}
