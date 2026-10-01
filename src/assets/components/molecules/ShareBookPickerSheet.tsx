import { useMemo, useState } from 'react'
import { Check, EyeOff } from 'lucide-react'
import { Sheet } from '../atoms/Sheet'
import { SearchPill } from '../atoms/SearchPill'
import { Button } from '../atoms/Button'
import { BookPickList } from './BookPickList'
import { FormActions } from './FormLayout'
import type { ShareBook } from '../../../hooks/useShareCardExtras'

interface ShareBookPickerSheetProps {
  title: string
  /** Lo que se muestra sin buscar (ej. la lista de temporada). */
  books: ShareBook[]
  /** Si viene, el buscador busca aquí (ej. todos los pendientes). */
  searchPool?: ShareBook[]
  selectedId: string | null
  emptyText: string
  onSelect: (bookId: string | null) => void
  onClose: () => void
}

/** Elegir qué libro va en "Actual" o "Próxima" de la tarjeta para compartir. */
export function ShareBookPickerSheet({ title, books, searchPool, selectedId, emptyText, onSelect, onClose }: ShareBookPickerSheetProps) {
  const [search, setSearch] = useState('')
  const pool = searchPool ?? books
  const showSearch = pool.length > 6

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return books
    return pool.filter((b) => b.title.toLowerCase().includes(q) || (b.author ?? '').toLowerCase().includes(q)).slice(0, 30)
  }, [books, pool, search])

  return (
    <Sheet
      title={title}
      onClose={onClose}
      footer={
        <FormActions>
          <Button variant="outline" onClick={() => onSelect(null)}>
            <EyeOff size={17} />
            No mostrar
          </Button>
        </FormActions>
      }
    >
      <div className="animate-fade-in">
        {showSearch && (
          <SearchPill value={search} onChange={setSearch} placeholder="Buscar por título o autor..." className="mb-4" />
        )}

        {visible.length === 0 ? (
          <p className="text-body-md text-text-secondary text-center py-4">{search ? 'Ningún libro coincide.' : emptyText}</p>
        ) : (
          <BookPickList
            books={visible}
            onPick={(book) => onSelect(book.id)}
            isSelected={(book) => book.id === selectedId}
            trailing={(book) => (book.id === selectedId ? <Check size={18} strokeWidth={2.6} className="text-primary-text shrink-0" /> : null)}
          />
        )}
      </div>
    </Sheet>
  )
}
