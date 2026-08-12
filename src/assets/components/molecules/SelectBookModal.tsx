import { useMemo, useState } from 'react'
import { ImageOff } from 'lucide-react'
import { Modal } from '../atoms/Modal'
import { Input } from '../atoms/Input'
import { useUnassignedBooks } from '../../../hooks/useUnassignedBooks'
import type { Database } from '../../../types/database'

type Book = Database['public']['Tables']['books']['Row']

interface SelectBookModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string | undefined
  onSelect: (book: Book) => Promise<{ error: unknown }>
}

export function SelectBookModal({ isOpen, onClose, userId, onSelect }: SelectBookModalProps) {
  const { books, isLoading, refetch } = useUnassignedBooks(userId)
  const [search, setSearch] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    if (!search.trim()) return books
    const q = search.toLowerCase()
    return books.filter(
      (b) => b.title.toLowerCase().includes(q) || (b.author ?? '').toLowerCase().includes(q)
    )
  }, [books, search])

  async function handleSelect(book: Book) {
    setSavingId(book.id)
    const { error } = await onSelect(book)
    setSavingId(null)
    if (!error) {
      await refetch()
      onClose()
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Agregar libro a la saga">
      <Input placeholder="Buscar en tu librería..." value={search} onChange={(e) => setSearch(e.target.value)} />

      <div className="space-y-2 mt-4 max-h-96 overflow-y-auto">
        {isLoading && <p className="text-body-md text-text-secondary text-center py-4">Cargando...</p>}

        {!isLoading && filtered.length === 0 && (
          <p className="text-body-md text-text-secondary text-center py-4">
            No tienes libros disponibles. Todos tus libros ya pertenecen a una saga, o necesitas
            agregar uno nuevo primero desde Estante.
          </p>
        )}

        {filtered.map((book) => (
          <button
            key={book.id}
            onClick={() => handleSelect(book)}
            disabled={savingId === book.id}
            className="w-full flex gap-3 items-center bg-bg rounded-xl p-2 text-left disabled:opacity-50"
          >
            <div className="w-10 shrink-0 aspect-2/3 rounded-md overflow-hidden bg-border">
              {book.cover_url ? (
                <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageOff size={14} className="text-text-secondary" />
                </div>
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