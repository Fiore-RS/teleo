import { useMemo, useState } from 'react'
import { Bookmark, Search, Trash2, X } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { useCachedQuery } from '../../../hooks/useCachedQuery'
import { useReleases, type Release } from '../../../hooks/useReleases'
import { Sheet } from '../atoms/Sheet'
import { Input } from '../atoms/Input'
import { DateInput } from '../atoms/DateInput'
import { PriceInput } from '../atoms/PriceInput'
import { Button } from '../atoms/Button'
import { MiniCover } from '../atoms/MiniCover'

interface WishlistBook {
  id: string
  title: string
  author: string | null
  cover_url: string | null
  price: number | null
}

const EMPTY_WISHLIST: WishlistBook[] = []
const labelClass = 'font-body font-semibold text-body-sm text-text-secondary block mb-1.5'

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

  return (
    <Sheet onClose={onClose} title={release ? 'Editar lanzamiento' : 'Nuevo lanzamiento'}>
      <div className="flex flex-col gap-4">
        {/* Enlace opcional a un deseado */}
        <div>
          <p className={labelClass}>Libro de tus deseados (opcional)</p>
          {linkedBook ? (
            <div className="flex items-center gap-3 bg-surface-2 border border-border rounded-2xl p-2.5">
              <MiniCover src={linkedBook.cover_url} title={linkedBook.title} className="w-10" />
              <span className="flex-1 min-w-0">
                <span className="block font-display font-semibold text-body-md text-text truncate">{linkedBook.title}</span>
                {linkedBook.author && <span className="block text-body-sm text-text-secondary truncate">{linkedBook.author}</span>}
              </span>
              <button
                type="button"
                onClick={() => setBookId(null)}
                aria-label="Quitar enlace con el libro"
                className="w-8 h-8 shrink-0 rounded-full text-text-secondary flex items-center justify-center hover:bg-surface"
              >
                <X size={16} />
              </button>
            </div>
          ) : isPickingBook ? (
            <div className="bg-surface-2 border border-border rounded-2xl p-2.5">
              <Input icon={Search} placeholder="Buscar en tus deseados..." value={search} onChange={(e) => setSearch(e.target.value)} autoFocus />
              {results.length === 0 ? (
                <p className="text-body-sm text-text-secondary text-center py-3">
                  {wishlist.length === 0 ? 'No tienes libros deseados.' : 'Ningún deseado coincide.'}
                </p>
              ) : (
                <ul className="mt-2">
                  {results.map((book) => (
                    <li key={book.id}>
                      <button
                        type="button"
                        onClick={() => chooseBook(book)}
                        className="w-full flex items-center gap-3 p-1.5 rounded-xl text-left active:bg-surface"
                      >
                        <MiniCover src={book.cover_url} title={book.title} className="w-8" />
                        <span className="flex-1 min-w-0">
                          <span className="block font-semibold text-body-sm text-text truncate">{book.title}</span>
                          {book.author && <span className="block text-[12px] text-text-secondary truncate">{book.author}</span>}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <button type="button" onClick={() => setIsPickingBook(false)} className="w-full text-body-sm font-bold text-text-secondary pt-2">
                Cancelar
              </button>
            </div>
          ) : (
            <Button variant="soft" onClick={() => setIsPickingBook(true)}>
              <Bookmark size={17} />
              Elegir de tus deseados
            </Button>
          )}
        </div>

        <div>
          <label htmlFor="release-title" className={labelClass}>Título</label>
          <Input id="release-title" placeholder="Título del libro" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label htmlFor="release-author" className={labelClass}>Autor (opcional)</label>
          <Input id="release-author" placeholder="Autor" value={author} onChange={(e) => setAuthor(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Fecha</label>
            <DateInput value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Precio (opcional)</label>
            <PriceInput value={price} onChange={setPrice} />
          </div>
        </div>
        <div>
          <label htmlFor="release-place" className={labelClass}>Dónde (opcional)</label>
          <Input id="release-place" placeholder="Librería, tienda en línea, preventa..." value={place} onChange={(e) => setPlace(e.target.value)} />
        </div>

        {error && <p className="text-body-sm text-primary-text text-center">{error}</p>}

        <Button variant="primary" onClick={handleSave} isLoading={isSaving}>
          {release ? 'Guardar cambios' : 'Agregar lanzamiento'}
        </Button>
        {release && (
          <Button variant="outline" onClick={handleDelete} disabled={isSaving}>
            <Trash2 size={17} />
            {confirmDelete ? '¿Seguro? Toca otra vez para eliminar' : 'Eliminar lanzamiento'}
          </Button>
        )}
      </div>
    </Sheet>
  )
}
