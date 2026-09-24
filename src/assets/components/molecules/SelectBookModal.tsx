import { useMemo, useState } from 'react'
import { Check, ImageOff } from 'lucide-react'
import { CoverImage } from '../atoms/CoverImage'
import { Modal } from '../atoms/Modal'
import { Input } from '../atoms/Input'
import { Button } from '../atoms/Button'
import { useUnassignedBooks } from '../../../hooks/useUnassignedBooks'
import type { Database } from '../../../types/database'

type Book = Database['public']['Tables']['books']['Row']

interface SelectBookModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string | undefined
  /** Recibe los libros en el orden en que se marcaron. */
  onConfirm: (books: Book[]) => Promise<{ error: unknown }>
}

/** Selector de libros para agregar a una saga, con selección múltiple (feedback de las
 *  beta-testers): se marcan varios, se ve el orden en que se eligieron y se agregan todos con
 *  un solo botón. Solo muestra libros que todavía no están en ninguna saga. La búsqueda no
 *  borra lo ya marcado. */
export function SelectBookModal({ isOpen, onClose, userId, onConfirm }: SelectBookModalProps) {
  const { books, isLoading, refetch } = useUnassignedBooks(userId)
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filtered = useMemo(() => {
    if (!search.trim()) return books
    const q = search.toLowerCase()
    return books.filter(
      (b) => b.title.toLowerCase().includes(q) || (b.author ?? '').toLowerCase().includes(q)
    )
  }, [books, search])

  function toggle(bookId: string) {
    setSelectedIds((prev) => (prev.includes(bookId) ? prev.filter((id) => id !== bookId) : [...prev, bookId]))
  }

  function handleClose() {
    setSelectedIds([])
    setSearch('')
    setError(null)
    onClose()
  }

  async function handleConfirm() {
    const selected = selectedIds
      .map((id) => books.find((b) => b.id === id))
      .filter((b): b is Book => !!b)
    if (selected.length === 0) return
    setIsSaving(true)
    setError(null)
    const { error: saveError } = await onConfirm(selected)
    setIsSaving(false)
    if (saveError) {
      setError('No se pudieron agregar todos los libros. Revisa la saga e inténtalo de nuevo.')
      return
    }
    await refetch()
    handleClose()
  }

  const count = selectedIds.length

  return (
    <Modal variant="sheet" isOpen={isOpen} onClose={handleClose} title="Agregar libros a la saga">
      <Input placeholder="Buscar en tu librería..." value={search} onChange={(e) => setSearch(e.target.value)} />

      <div className="space-y-2 mt-4 max-h-96 overflow-y-auto">
        {!isLoading && filtered.length === 0 && (
          <p className="text-body-md text-text-secondary text-center py-4">
            {search.trim()
              ? 'Ningún libro coincide con tu búsqueda.'
              : 'No tienes libros disponibles. Todos tus libros ya pertenecen a una saga, o necesitas agregar uno nuevo primero desde Estante.'}
          </p>
        )}

        {filtered.map((book) => {
          const position = selectedIds.indexOf(book.id)
          const isSelected = position !== -1
          return (
            <button
              key={book.id}
              type="button"
              onClick={() => toggle(book.id)}
              aria-pressed={isSelected}
              className={`w-full flex gap-3 items-center rounded-2xl p-2 text-left border transition-colors ${
                isSelected ? 'bg-primary-soft border-primary-text' : 'bg-surface-2 border-border'
              }`}
            >
              <div className="w-10 shrink-0 aspect-2/3 rounded-md overflow-hidden bg-surface-2">
                {book.cover_url ? (
                  <CoverImage src={book.cover_url ?? undefined} alt={book.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageOff size={14} className="text-text-secondary" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-body-md text-text line-clamp-1">{book.title}</p>
                {book.author && <p className="text-body-sm text-text-secondary line-clamp-1">{book.author}</p>}
              </div>
              {/* Casilla: vacía, o con el número de orden en que se eligió. */}
              <span
                aria-hidden="true"
                className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-body-sm font-bold ${
                  isSelected ? 'bg-primary text-primary-ink' : 'border-[1.5px] border-border bg-surface'
                }`}
              >
                {isSelected ? (count > 1 ? position + 1 : <Check size={14} strokeWidth={3} />) : null}
              </span>
            </button>
          )
        })}
      </div>

      {error && <p className="text-body-sm text-primary-text text-center mt-3">{error}</p>}

      <Button variant="primary" className="mt-4" onClick={handleConfirm} isLoading={isSaving} disabled={count === 0}>
        {count === 0 ? 'Elige uno o más libros' : `Agregar ${count} ${count === 1 ? 'libro' : 'libros'}`}
      </Button>
    </Modal>
  )
}
