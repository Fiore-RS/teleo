import { useMemo, useState } from 'react'
import { Bookmark, Search, Trash2, X, Plus, ChevronRight } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { useCachedQuery } from '../../../hooks/useCachedQuery'
import { useReleases, type Release } from '../../../hooks/useReleases'
import { Sheet } from '../atoms/Sheet'
import { Input } from '../atoms/Input'
import { DateInput } from '../atoms/DateInput'
import { PriceInput } from '../atoms/PriceInput'
import { Button } from '../atoms/Button'
import { MiniCover } from '../atoms/MiniCover'
import { CoverImage } from '../atoms/CoverImage'
import { FormActions, FormCard, FormRow, FormSection } from './FormLayout'

interface WishlistBook {
  id: string
  title: string
  author: string | null
  cover_url: string | null
  price: number | null
}

const EMPTY_WISHLIST: WishlistBook[] = []

interface ReleaseFormSheetProps {
  userId: string | undefined
  /** Si viene, se edita ese lanzamiento; si no, se crea uno nuevo. */
  release?: Release | null
  /** Fecha propuesta al crear (el día elegido en el calendario). */
  initialDate?: string
  /** Libro deseado ya elegido al crear desde su detalle. */
  initialBookId?: string
  onClose: () => void
}

/** Agregar o editar un lanzamiento (fase 7). Opcionalmente se enlaza a un libro de la lista
 *  de deseados: al elegirlo se llenan título y autor (y el precio, si el libro lo tiene), y el
 *  lanzamiento aparece también en el detalle de ese libro. */
export function ReleaseFormSheet({ userId, release, initialDate, initialBookId, onClose }: ReleaseFormSheetProps) {
  const { addRelease, updateRelease, deleteRelease } = useReleases(userId)
  const { data: wishlist } = useCachedQuery<WishlistBook[]>(
    ['wishlistForReleases', userId],
    async () => {
      const { data } = await supabase
        .from('books')
        .select('id, title, author, cover_url, price')
        .eq('user_id', userId!)
        .eq('status', 'deseado')
        .order('title', { ascending: true })
      return data ?? []
    },
    EMPTY_WISHLIST,
    { enabled: !!userId }
  )

  const [bookId, setBookId] = useState<string | null>(release?.book_id ?? initialBookId ?? null)
  const [title, setTitle] = useState(release?.title ?? '')
  const [author, setAuthor] = useState(release?.author ?? '')
  const [date, setDate] = useState(release?.release_date ?? initialDate ?? '')
  const [place, setPlace] = useState(release?.place ?? '')
  const [price, setPrice] = useState(release?.price != null ? String(release.price) : '')
  const [search, setSearch] = useState('')
  const [isPickingBook, setIsPickingBook] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const linkedBook = wishlist.find((b) => b.id === bookId)
  // Al crear desde el detalle de un libro, se llenan sus datos en cuanto llega la lista.
  const [prefilled, setPrefilled] = useState(!initialBookId || !!release)
  if (!prefilled && linkedBook) {
    setPrefilled(true)
    setTitle(linkedBook.title)
    setAuthor(linkedBook.author ?? '')
    if (linkedBook.price != null) setPrice(String(linkedBook.price))
  }

  const results = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = q
      ? wishlist.filter((b) => b.title.toLowerCase().includes(q) || (b.author ?? '').toLowerCase().includes(q))
      : wishlist
    return list.slice(0, 6)
  }, [wishlist, search])

  function chooseBook(book: WishlistBook) {
    setBookId(book.id)
    setTitle(book.title)
    setAuthor(book.author ?? '')
    if (book.price != null && !price) setPrice(String(book.price))
    setIsPickingBook(false)
    setSearch('')
  }

  async function handleSave() {
    if (!title.trim()) return setError('Escribe el título del libro.')
    if (!date) return setError('Elige la fecha de lanzamiento.')
    setError(null)
    setIsSaving(true)
    const input = {
      title: title.trim(),
      author: author.trim() || null,
      release_date: date,
      place: place.trim() || null,
      price: price ? parseFloat(price) : null,
      book_id: bookId,
    }
    const ok = release ? await updateRelease(release.id, input) : await addRelease(input)
    setIsSaving(false)
    if (ok) onClose()
    else setError('No se pudo guardar. Inténtalo de nuevo.')
  }

  async function handleDelete() {
    if (!release) return
    if (!confirmDelete) return setConfirmDelete(true)
    setIsSaving(true)
    await deleteRelease(release.id)
    setIsSaving(false)
    onClose()
  }

  const footer = release ? (
    <FormActions>
      <Button
        variant="outline"
        fullWidth={false}
        className={confirmDelete ? 'px-4! shrink-0' : 'w-12.5 shrink-0 px-0!'}
        aria-label="Eliminar lanzamiento"
        onClick={handleDelete}
        disabled={isSaving}
      >
        <Trash2 size={18} />
        {confirmDelete && '¿Eliminar?'}
      </Button>
      <Button variant="primary" onClick={handleSave} isLoading={isSaving}>Guardar cambios</Button>
    </FormActions>
  ) : (
    <FormActions>
      <Button variant="outline" onClick={onClose}>Cancelar</Button>
      <Button variant="primary" onClick={handleSave} isLoading={isSaving}>Agregar</Button>
    </FormActions>
  )

  return (
    <Sheet onClose={onClose} title={release ? 'Editar lanzamiento' : 'Nuevo lanzamiento'} footer={footer}>
      <div className="animate-fade-in">
        <div className="flex gap-3.5 items-end mb-5">
          <div
            className={`relative w-19 shrink-0 aspect-2/3 rounded-[11px] overflow-hidden flex items-center justify-center ${
              linkedBook?.cover_url
                ? 'bg-surface-2 shadow-[0_10px_24px_-12px_rgba(60,30,10,0.55)]'
                : 'bg-surface-2 border-[1.5px] border-dashed border-border text-text-muted'
            }`}
          >
            {linkedBook?.cover_url ? (
              <CoverImage src={linkedBook.cover_url} alt={linkedBook.title} className="w-full h-full object-cover" />
            ) : (
              <Bookmark size={20} aria-hidden="true" />
            )}
          </div>
          <div className="flex-1 min-w-0 flex flex-col gap-2">
            <Input
              bare
              aria-label="Título"
              placeholder="Título del libro"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border-b-[1.5px] border-border focus:border-primary-text py-1 font-display font-semibold text-[19px] leading-tight"
            />
            <Input
              bare
              aria-label="Autor"
              placeholder="Autor"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="border-b-[1.5px] border-border focus:border-primary-text py-1 text-body-lg text-text-secondary"
            />
            {linkedBook ? (
              <button
                type="button"
                onClick={() => setBookId(null)}
                aria-label="Quitar enlace con el libro"
                className="self-start inline-flex items-center gap-1.5 mt-0.5 px-3 py-1 rounded-full bg-primary-soft text-primary-text font-body font-bold text-body-sm"
              >
                De tus deseados
                <X size={13} strokeWidth={2.4} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsPickingBook((v) => !v)}
                className="self-start inline-flex items-center gap-1.5 mt-0.5 px-3 py-1 rounded-full bg-primary-soft text-primary-text font-body font-bold text-body-sm"
              >
                {isPickingBook ? 'Cancelar búsqueda' : (<><Plus size={13} strokeWidth={2.4} />Elegir de tus deseados</>)}
              </button>
            )}
          </div>
        </div>

        {isPickingBook && !linkedBook && (
          <div className="mb-5 animate-fade-in">
            <div className="flex items-center gap-2 bg-surface-2 border border-border rounded-full px-4 py-2.5 mb-2.5 focus-within:border-primary-text transition-colors">
              <Search size={17} className="text-text-muted shrink-0" aria-hidden="true" />
              <input
                autoFocus
                aria-label="Buscar en tus deseados"
                placeholder="Buscar en tus deseados..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 min-w-0 bg-transparent focus:outline-none font-body text-body-lg text-text placeholder:text-text-muted"
              />
            </div>
            {results.length === 0 ? (
              <p className="text-body-sm text-text-secondary text-center py-3">
                {wishlist.length === 0 ? 'No tienes libros deseados.' : 'Ningún deseado coincide.'}
              </p>
            ) : (
              <FormCard>
                {results.map((book) => (
                  <button
                    key={book.id}
                    type="button"
                    onClick={() => chooseBook(book)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left"
                  >
                    <MiniCover src={book.cover_url} title={book.title} className="w-8.5" />
                    <span className="flex-1 min-w-0">
                      <span className="block font-semibold text-body-md text-text truncate">{book.title}</span>
                      {book.author && <span className="block text-body-sm text-text-secondary truncate">{book.author}</span>}
                    </span>
                    <ChevronRight size={18} className="text-text-muted shrink-0" />
                  </button>
                ))}
              </FormCard>
            )}
          </div>
        )}

        <FormSection label="El lanzamiento" className="mb-1">
          <FormCard>
            <FormRow label="Fecha">
              <DateInput bare value={date} onChange={(e) => setDate(e.target.value)} />
            </FormRow>
            <FormRow label="Precio" optional>
              <PriceInput bare value={price} onChange={setPrice} className="text-right text-body-lg" />
            </FormRow>
            <FormRow label="Dónde" optional htmlFor="release-place">
              <Input
                bare
                id="release-place"
                placeholder="Librería, preventa..."
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                className="text-right text-body-lg"
              />
            </FormRow>
          </FormCard>
        </FormSection>

        {error && <p className="text-body-sm text-primary-text text-center mt-3 animate-fade-in">{error}</p>}
      </div>
    </Sheet>
  )
}
