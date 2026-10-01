import { useMemo, useState, type ReactNode } from 'react'
import { ImageOff, Search, ChevronRight } from 'lucide-react'
import { Sheet } from '../atoms/Sheet'
import { Button } from '../atoms/Button'
import { CoverImage } from '../atoms/CoverImage'
import { BookMiniHeader } from './BookMiniHeader'
import { FormActions, FormCard, FormSection } from './FormLayout'
import { QuoteFields } from './QuoteFields'
import { useLibraryBooks } from '../../../hooks/useLibraryBooks'
import type { QuoteBook } from '../../../hooks/useQuotes'
import { normalizeForSearch, parsePage } from '../../../lib/quotes'

// Primero lo que estás leyendo (donde más se subrayan citas), después lo terminado.
const STATUS_ORDER: Record<string, number> = { leyendo: 0, terminado: 1, pendiente: 2, abandonado: 3 }

interface AddQuoteSheetProps {
  userId: string | undefined
  onClose: () => void
  onSave: (book: QuoteBook, text: string, page: number | null) => Promise<boolean>
  /** Libro ya elegido (desde el detalle del libro o Actualizar progreso): se salta la lista. */
  initialBook?: QuoteBook
  /** Página con la que arranca el campo (ej. la página actual). */
  initialPage?: number | null
}

/** Agregar una cita desde Mis citas (V.2.1.0): primero se elige el libro y después se
 *  escribe la cita, con la página opcional. Si el libro se está leyendo, la página arranca
 *  con la página actual. */
export function AddQuoteSheet({ userId, onClose, onSave, initialBook, initialPage }: AddQuoteSheetProps) {
  const { books, isLoading } = useLibraryBooks(userId)
  const [search, setSearch] = useState('')
  const [book, setBook] = useState<QuoteBook | null>(initialBook ?? null)
  const [text, setText] = useState('')
  const [page, setPage] = useState(initialPage ? String(initialPage) : '')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const options = useMemo(() => {
    const q = normalizeForSearch(search.trim())
    return books
      .filter((b) => b.status !== 'deseado')
      .filter((b) => !q || normalizeForSearch(`${b.title} ${b.author ?? ''}`).includes(q))
      .sort((a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9) || a.title.localeCompare(b.title, 'es'))
  }, [books, search])

  function pickBook(b: (typeof books)[number]) {
    setBook({ id: b.id, title: b.title, author: b.author, cover_url: b.cover_url, status: b.status })
    setPage(b.status === 'leyendo' && b.current_page ? String(b.current_page) : '')
  }

  async function handleSave() {
    if (!book || !text.trim()) return
    setIsSaving(true)
    setError(null)
    const ok = await onSave(book, text.trim(), parsePage(page))
    setIsSaving(false)
    if (ok) onClose()
    else setError('No se pudo guardar la cita. Intenta de nuevo.')
  }

  const reading = options.filter((b) => b.status === 'leyendo')
  const others = options.filter((b) => b.status !== 'leyendo')

  function renderRows(list: typeof options): ReactNode {
    return (
      <FormCard>
        {list.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => pickBook(b)}
            className="w-full flex gap-3 items-center px-3 py-2.5 text-left focus-visible:outline-2 focus-visible:outline-primary-text"
          >
            <div className="w-8.5 shrink-0 aspect-2/3 rounded-[5px] overflow-hidden bg-surface">
              {b.cover_url ? (
                <CoverImage src={b.cover_url} alt={b.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><ImageOff size={12} className="text-text-secondary" /></div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-body font-semibold text-body-md text-text truncate">{b.title}</p>
              {b.author && <p className="text-body-sm text-text-secondary truncate">{b.author}</p>}
            </div>
            <ChevronRight size={18} className="text-text-muted shrink-0" />
          </button>
        ))}
      </FormCard>
    )
  }

  if (!book) {
    return (
      <Sheet
        onClose={onClose}
        title="Elige el libro"
        footer={<FormActions><Button variant="outline" onClick={onClose}>Cancelar</Button></FormActions>}
      >
        <div key="pick" className="animate-fade-in">
          <div className="flex items-center gap-2 bg-surface-2 border border-border rounded-full px-4 py-2.5 mb-5 focus-within:border-primary-text transition-colors">
            <Search size={17} className="text-text-muted shrink-0" aria-hidden="true" />
            <input
              aria-label="Buscar en tus libros"
              placeholder="Buscar en tus libros..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-0 bg-transparent focus:outline-none font-body text-body-lg text-text placeholder:text-text-muted"
            />
          </div>
          {!isLoading && options.length === 0 && (
            <p className="text-body-md text-text-secondary text-center py-4">No encontramos ese libro.</p>
          )}
          {reading.length > 0 && <FormSection label="Leyendo">{renderRows(reading)}</FormSection>}
          {others.length > 0 && <FormSection label="Tus libros" className="mb-1">{renderRows(others)}</FormSection>}
        </div>
      </Sheet>
    )
  }

  return (
    <Sheet
      onClose={onClose}
      title="Nueva cita"
      footer={
        <FormActions>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={handleSave} isLoading={isSaving} disabled={!text.trim()}>Guardar cita</Button>
        </FormActions>
      }
    >
      <div key="write" className="animate-fade-in">
        <BookMiniHeader
          book={book}
          action={
            <button
              type="button"
              onClick={() => setBook(null)}
              className="shrink-0 px-3 py-1.5 rounded-full bg-primary-soft text-primary-text font-body font-bold text-body-sm focus-visible:outline-2 focus-visible:outline-primary-text"
            >
              Cambiar
            </button>
          }
        />
        <QuoteFields text={text} page={page} onTextChange={setText} onPageChange={setPage} idPrefix="new-quote" />
        {error && <p className="text-body-sm text-primary-text text-center mt-3">{error}</p>}
      </div>
    </Sheet>
  )
}
