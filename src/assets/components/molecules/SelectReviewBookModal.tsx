import { useMemo, useState } from 'react'
import { ImageOff } from 'lucide-react'
import { Modal } from '../atoms/Modal'
import { Input } from '../atoms/Input'
import { useReviewableBooks } from '../../../hooks/useReviewableBooks'

interface SelectReviewBookModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string | undefined
  onSelect: (bookId: string) => void
}

export function SelectReviewBookModal({ isOpen, onClose, userId, onSelect }: SelectReviewBookModalProps) {
  const { books, isLoading } = useReviewableBooks(userId)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return books
    const q = search.toLowerCase()
    return books.filter((b) => b.title.toLowerCase().includes(q) || (b.author ?? '').toLowerCase().includes(q))
  }, [books, search])

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Elige un libro para reseñar">
      <Input placeholder="Buscar en tus libros terminados..." value={search} onChange={(e) => setSearch(e.target.value)} />
      <div className="space-y-2 mt-4 max-h-96 overflow-y-auto">
        {isLoading && <p className="text-body-md text-text-secondary text-center py-4">Cargando...</p>}
        {!isLoading && filtered.length === 0 && (
          <p className="text-body-md text-text-secondary text-center py-4">
            No tienes libros terminados sin reseña todavía.
          </p>
        )}
        {filtered.map((book) => (
          <button key={book.id} onClick={() => onSelect(book.id)} className="w-full flex gap-3 items-center bg-bg rounded-xl p-2 text-left">
            <div className="w-10 shrink-0 aspect-2/3 rounded-md overflow-hidden bg-border">
              {book.cover_url ? (
                <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><ImageOff size={14} className="text-text-secondary" /></div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-body-md text-text line-clamp-1">{book.title}</p>
              {book.author && <p className="text-body-sm text-text-secondary line-clamp-1">{book.author}</p>}
            </div>
          </button>
        ))}
      </div>
    </Modal>
  )
}