import { useMemo, useState } from 'react'
import { ImageOff, ChevronLeft } from 'lucide-react'
import { Modal } from '../atoms/Modal'
import { Input } from '../atoms/Input'
import { Textarea } from '../atoms/Textarea'
import { Button } from '../atoms/Button'
import { CoverImage } from '../atoms/CoverImage'
import { useLibraryBooks } from '../../../hooks/useLibraryBooks'
import type { QuoteBook } from '../../../hooks/useQuotes'
import { cleanPageInput, normalizeForSearch, parsePage } from '../../../lib/quotes'

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

function Cover({ url, title, className }: { url: string | null; title: string; className: string }) {
  return (
    <div className={`${className} shrink-0 aspect-2/3 rounded-md overflow-hidden bg-surface-2`}>
      {url ? (
        <CoverImage src={url} alt={title} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center"><ImageOff size={14} className="text-text-secondary" /></div>
      )}
    </div>
  )
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

  return (
    <Modal variant="sheet" isOpen onClose={onClose} title={book ? 'Nueva cita' : 'Elige el libro'}>
      {!book ? (
        <>
          <Input placeholder="Buscar en tus libros..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <div className="space-y-2 mt-4 max-h-96 overflow-y-auto">
            {!isLoading && options.length === 0 && (
              <p className="text-body-md text-text-secondary text-center py-4">No encontramos ese libro.</p>
            )}
            {options.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => pickBook(b)}
                className="w-full flex gap-3 items-center bg-surface-2 border border-border rounded-2xl p-2 text-left focus-visible:outline-2 focus-visible:outline-primary-text"
              >
                <Cover url={b.cover_url} title={b.title} className="w-10" />
                <div className="min-w-0">
                  <p className="text-body-md text-text line-clamp-1">{b.title}</p>
                  {b.author && <p className="text-body-sm text-text-secondary line-clamp-1">{b.author}</p>}
                </div>
                {b.status === 'leyendo' && (
                  <span className="ml-auto shrink-0 text-body-sm font-bold text-orange-text bg-orange-soft rounded-full px-2.5 py-0.5">Leyendo</span>
                )}
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-4">
          <button
            type="button"
            onClick={() => setBook(null)}
            aria-label="Cambiar libro"
            className="flex items-center gap-3 bg-surface-2 border border-border rounded-2xl p-2 text-left focus-visible:outline-2 focus-visible:outline-primary-text"
          >
            <ChevronLeft size={18} className="text-text-secondary shrink-0" />
            <Cover url={book.cover_url} title={book.title} className="w-9" />
            <div className="min-w-0">
              <p className="text-body-md font-semibold text-text line-clamp-1">{book.title}</p>
              <p className="text-body-sm text-text-secondary">Toca para cambiar de libro</p>
            </div>
          </button>

          <Textarea
            autoFocus
            placeholder="¿Qué frase te gustó?"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            className="font-display italic"
          />

          <div className="flex items-center gap-3">
            <label htmlFor="quote-page" className="text-body-md font-semibold text-text-secondary">Página</label>
            <div className="w-28">
              <Input
                id="quote-page" inputMode="numeric" placeholder="Opcional" value={page}
                onChange={(e) => setPage(cleanPageInput(e.target.value))}
              />
            </div>
          </div>

          {error && <p className="text-body-sm text-primary-text text-center">{error}</p>}

          <div className="flex gap-2.5">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button variant="primary" onClick={handleSave} isLoading={isSaving} disabled={!text.trim()}>Guardar cita</Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
