import { useMemo, useState } from 'react'
import { Check, EyeOff, Search } from 'lucide-react'
import { Sheet } from '../atoms/Sheet'
import { Input } from '../atoms/Input'
import { Button } from '../atoms/Button'
import { MiniCover } from '../atoms/MiniCover'
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
    <Sheet title={title} onClose={onClose}>
      {showSearch && (
        <div className="mb-3">
          <Input icon={Search} placeholder="Buscar por título o autor..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      )}

      {visible.length === 0 ? (
        <p className="text-body-md text-text-secondary text-center py-4">{search ? 'Ningún libro coincide.' : emptyText}</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {visible.map((book) => {
            const isSelected = book.id === selectedId
            return (
              <li key={book.id}>
                <button
                  type="button"
                  onClick={() => onSelect(book.id)}
                  aria-pressed={isSelected}
                  className={`w-full flex items-center gap-3 p-2 rounded-2xl text-left border transition-colors ${
                    isSelected ? 'bg-primary-soft border-primary' : 'border-transparent active:bg-surface-2'
                  }`}
                >
                  <MiniCover src={book.cover_url} title={book.title} className="w-11" />
                  <span className="flex-1 min-w-0">
                    <span className="block font-display font-semibold text-body-md text-text truncate">{book.title}</span>
                    {book.author && <span className="block text-body-sm text-text-secondary truncate">{book.author}</span>}
                  </span>
                  {isSelected && <Check size={18} className="text-primary-text shrink-0" />}
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <Button variant="outline" className="mt-4" onClick={() => onSelect(null)}>
        <EyeOff size={17} />
        No mostrar
      </Button>
    </Sheet>
  )
}
