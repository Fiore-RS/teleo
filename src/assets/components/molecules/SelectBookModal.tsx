import { useMemo, useState } from 'react'
import { Check } from 'lucide-react'
import { Sheet } from '../atoms/Sheet'
import { SearchPill } from '../atoms/SearchPill'
import { Button } from '../atoms/Button'
import { BookPickList } from './BookPickList'
import { FormActions } from './FormLayout'
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

  if (!isOpen) return null

  return (
    <Sheet
      onClose={handleClose}
      title="Agregar libros a la saga"
      footer={
        <FormActions>
          <Button variant="outline" onClick={handleClose}>Cancelar</Button>
          <Button variant="primary" onClick={handleConfirm} isLoading={isSaving} disabled={count === 0}>
            {count === 0 ? 'Elige libros' : `Agregar ${count} ${count === 1 ? 'libro' : 'libros'}`}
          </Button>
        </FormActions>
      }
    >
      <div className="animate-fade-in">
        <SearchPill value={search} onChange={setSearch} placeholder="Buscar en tu librería..." className="mb-4" />

        {!isLoading && filtered.length === 0 ? (
          <p className="text-body-md text-text-secondary text-center py-4">
            {search.trim()
              ? 'Ningún libro coincide con tu búsqueda.'
              : 'No tienes libros disponibles. Todos tus libros ya pertenecen a una saga, o necesitas agregar uno nuevo primero desde Estante.'}
          </p>
        ) : (
          <BookPickList
            books={filtered}
            onPick={(book) => toggle(book.id)}
            isSelected={(book) => selectedIds.includes(book.id)}
            trailing={(book) => {
              const position = selectedIds.indexOf(book.id)
              const isSelected = position !== -1
              // Círculo: vacío, o con el número de orden en que se eligió.
              return (
                <span
                  aria-hidden="true"
                  className={`w-6.5 h-6.5 shrink-0 rounded-full flex items-center justify-center text-body-sm font-bold transition-colors ${
                    isSelected ? 'bg-primary text-primary-ink' : 'border-[1.5px] border-border bg-surface'
                  }`}
                >
                  {isSelected ? (count > 1 ? position + 1 : <Check size={13} strokeWidth={3} />) : null}
                </span>
              )
            }}
          />
        )}

        {error && <p className="text-body-sm text-primary-text text-center mt-3">{error}</p>}
      </div>
    </Sheet>
  )
}
