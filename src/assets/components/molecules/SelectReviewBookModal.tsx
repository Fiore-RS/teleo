import { useMemo, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { Sheet } from '../atoms/Sheet'
import { SearchPill } from '../atoms/SearchPill'
import { Button } from '../atoms/Button'
import { BookPickList } from './BookPickList'
import { FormActions } from './FormLayout'
import { useReviewableBooks } from '../../../hooks/useReviewableBooks'

interface SelectReviewBookModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string | undefined
  onSelect: (bookId: string) => void
}

/** Elegir un libro terminado para escribir su reseña (rediseñado en la V.2.2.0). */
export function SelectReviewBookModal({ isOpen, onClose, userId, onSelect }: SelectReviewBookModalProps) {
  const { books, isLoading } = useReviewableBooks(userId)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return books
    const q = search.toLowerCase()
    return books.filter((b) => b.title.toLowerCase().includes(q) || (b.author ?? '').toLowerCase().includes(q))
  }, [books, search])

  if (!isOpen) return null

  return (
    <Sheet
      onClose={onClose}
      title="Elige un libro para reseñar"
      footer={<FormActions><Button variant="outline" onClick={onClose}>Cancelar</Button></FormActions>}
    >
      <div className="animate-fade-in">
        <SearchPill value={search} onChange={setSearch} placeholder="Buscar en tus terminados..." className="mb-4" />
        {!isLoading && filtered.length === 0 ? (
          <p className="text-body-md text-text-secondary text-center py-4">
            {search.trim() ? 'Ningún libro coincide con tu búsqueda.' : 'No tienes libros terminados sin reseña todavía.'}
          </p>
        ) : (
          <BookPickList
            books={filtered}
            onPick={(book) => onSelect(book.id)}
            trailing={() => <ChevronRight size={18} className="text-text-muted shrink-0" />}
          />
        )}
      </div>
    </Sheet>
  )
}
