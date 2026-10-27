import { useMemo, useState } from 'react'
import { Check } from 'lucide-react'
import { Sheet } from '../atoms/Sheet'
import { Button } from '../atoms/Button'
import { SearchBar } from './SearchBar'
import { BookPickList } from './BookPickList'
import { FormActions, FormHint, FormSectionLabel } from './FormLayout'
import { AddBookModal } from './AddBookModal'
import { usePendingBooks, type PendingBook } from '../../../hooks/usePendingBooks'
import { useLibraryBooks } from '../../../hooks/useLibraryBooks'
import { queryClient } from '../../../lib/queryClient'

interface NextReadsSheetProps {
  userId: string | undefined
  onClose: () => void
  /** Guarda: suma los nuevos al final (en el orden en que se tocaron) y quita los desmarcados. */
  onSave: (addIds: string[], removeIds: string[]) => Promise<{ error: unknown }>
}

function normalize(text: string) {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

/** "Agregar libros" de Mis próximas lecturas (V.3.3.0, vista previa C). Muestra todos los
 *  pendientes: arriba los que ya están en la lista (marcados) y abajo el resto. Tocar una fila
 *  la marca o la desmarca; las filas no cambian de grupo hasta guardar, para que nada salte
 *  mientras se elige. Encima de los botones, un resumen de lo que va a cambiar. */
export function NextReadsSheet({ userId, onClose, onSave }: NextReadsSheetProps) {
  const { books, isLoading } = usePendingBooks(userId)
  const [search, setSearch] = useState('')
  // Cambios respecto de cómo está la lista: los agregados en orden de toque y los quitados.
  const [added, setAdded] = useState<string[]>([])
  const [removed, setRemoved] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const inList = useMemo(
    () => books.filter((b) => b.is_priority).sort((a, b) => (a.priority_sort_order ?? 0) - (b.priority_sort_order ?? 0)),
    [books]
  )
  const others = useMemo(() => books.filter((b) => !b.is_priority), [books])

  const query = normalize(search.trim())
  const matches = (b: PendingBook) => !query || normalize(`${b.title} ${b.author ?? ''}`).includes(query)

  function isSelected(book: PendingBook) {
    return book.is_priority ? !removed.includes(book.id) : added.includes(book.id)
  }

  function toggle(book: PendingBook) {
    if (book.is_priority) {
      setRemoved((r) => (r.includes(book.id) ? r.filter((id) => id !== book.id) : [...r, book.id]))
    } else {
      setAdded((a) => (a.includes(book.id) ? a.filter((id) => id !== book.id) : [...a, book.id]))
    }
  }

  const hasChanges = added.length > 0 || removed.length > 0
  const summary = summaryText(added.length, removed.length)

  async function handleSave() {
    if (!hasChanges) return
    setIsSaving(true)
    setError(null)
    const { error: saveError } = await onSave(added, removed)
    setIsSaving(false)
    if (saveError) {
      setError('No se pudieron guardar los cambios. Inténtalo de nuevo.')
      return
    }
    onClose()
  }

  const tick = (book: PendingBook) => (
    <span
      aria-hidden="true"
      className={`w-6 h-6 shrink-0 rounded-full border-[1.5px] flex items-center justify-center ${
        isSelected(book) ? 'bg-primary border-primary text-primary-ink' : 'bg-surface border-border'
      }`}
    >
      {isSelected(book) && <Check size={13} strokeWidth={3.2} />}
    </span>
  )

  const visibleInList = inList.filter(matches)
  const visibleOthers = others.filter(matches)

  return (
    <Sheet
      title="Agregar libros"
      onClose={onClose}
      footer={
        books.length > 0 ? (
          <>
            {summary && <p className="text-body-sm text-text-secondary text-center mb-2 animate-fade-in">{summary}</p>}
            <FormActions>
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <Button variant="primary" onClick={handleSave} isLoading={isSaving} disabled={!hasChanges}>Guardar</Button>
            </FormActions>
          </>
        ) : undefined
      }
    >
      {isLoading ? (
        <p className="text-body-md text-text-secondary">Cargando tus pendientes…</p>
      ) : books.length === 0 ? (
        <EmptyPending userId={userId} onAdded={onClose} />
      ) : (
        <div className="animate-fade-in">
          <SearchBar placeholder="Buscar en tus pendientes..." value={search} onChange={(e) => setSearch(e.target.value)} />

          {visibleInList.length > 0 && (
            <section className="mt-4">
              <div className="flex items-baseline justify-between">
                <FormSectionLabel>En tu lista</FormSectionLabel>
                <span className="text-body-sm font-semibold text-text-muted px-1">Toca para quitar</span>
              </div>
              <BookPickList books={visibleInList} onPick={toggle} isSelected={isSelected} trailing={tick} />
            </section>
          )}

          {visibleOthers.length > 0 && (
            <section className="mt-4">
              <div className="flex items-baseline justify-between">
                <FormSectionLabel>{inList.length > 0 ? 'Otros pendientes' : 'Tus pendientes'}</FormSectionLabel>
                <span className="text-body-sm font-semibold text-text-muted px-1">Toca para agregar</span>
              </div>
              <BookPickList books={visibleOthers} onPick={toggle} isSelected={isSelected} trailing={tick} />
            </section>
          )}

          {visibleInList.length === 0 && visibleOthers.length === 0 && (
            <p className="text-body-md text-text-secondary text-center mt-6">Ningún pendiente coincide con tu búsqueda.</p>
          )}

          {error && <FormHint text={error} tone="error" />}
        </div>
      )}
    </Sheet>
  )
}

function summaryText(addedCount: number, removedCount: number): string | null {
  const libros = (n: number) => (n === 1 ? '1 libro' : `${n} libros`)
  if (addedCount && removedCount) return `Se suma${addedCount === 1 ? '' : 'n'} ${libros(addedCount)} y sale${removedCount === 1 ? '' : 'n'} ${removedCount} de la lista.`
  if (addedCount) return `Se suma${addedCount === 1 ? '' : 'n'} ${libros(addedCount)} a la lista.`
  if (removedCount) return `Sale${removedCount === 1 ? '' : 'n'} ${libros(removedCount)} de la lista.`
  return null
}

/** Sin pendientes: se ofrece agregar uno, con "Próxima lectura" ya marcado. Vive aparte para
 *  que la lista completa de libros (useLibraryBooks) se pida solo en este caso. */
function EmptyPending({ userId, onAdded }: { userId: string | undefined; onAdded: () => void }) {
  const { addBook } = useLibraryBooks(userId)
  const [isAddOpen, setIsAddOpen] = useState(false)

  return (
    <div className="text-center py-4">
      <p className="text-body-md text-text-secondary">
        No tienes libros pendientes. Agrega uno y queda directo en tus próximas lecturas.
      </p>
      <Button variant="soft" className="mt-4" onClick={() => setIsAddOpen(true)}>
        Agregar un libro
      </Button>
      <AddBookModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        userId={userId}
        initialStatus="pendiente"
        initialPriority
        onAdd={async (book) => {
          const result = await addBook(book)
          if (!result.error) {
            await queryClient.invalidateQueries()
            onAdded()
          }
          return result
        }}
      />
    </div>
  )
}
