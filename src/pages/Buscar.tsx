import { useMemo, useState, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useLibraryBooks } from '../hooks/useLibraryBooks'
import { useLibrarySagas } from '../hooks/useLibrarySagas'
import { useReviews } from '../hooks/useReviews'
import { useQuotes } from '../hooks/useQuotes'
import { normalizeForSearch } from '../lib/quotes'
import { useBreakpoint } from '../hooks/useBreakpoint'
import { TabBar, type TabKey } from '../assets/components/molecules/TabBar'
import { EncabezadoAncho } from '../assets/components/molecules/EncabezadoAncho'
import { Shelf, type ShelfItem } from '../assets/components/molecules/Shelf'
import { BookCover } from '../assets/components/molecules/BookCover'
import { SagaCover } from '../assets/components/molecules/SagaCover'
import { DetalleLibro } from './DetalleLibro'
import { DetalleSaga } from './DetalleSaga'
import { Resena } from './Resena'
import { ReviewCard } from './Cuaderno'
import type { ReadingStatus } from '../lib/status'

/** ¿El texto contiene lo buscado, sin importar mayúsculas ni tildes? */
function matches(query: string, ...texts: (string | null | undefined)[]): boolean {
  return texts.some((t) => !!t && normalizeForSearch(t).includes(query))
}

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`
}

/** Un grupo de resultados con su título, su número y un enlace a la pantalla de origen. */
function Grupo({ title, count, linkLabel, onLink, children }: { title: string; count: number; linkLabel: string; onLink: () => void; children: ReactNode }) {
  return (
    <section className="mt-9 first:mt-0">
      <div className="flex items-baseline justify-between gap-3 mb-3.5">
        <h2 className="font-display font-semibold text-[22px] text-text">
          {title} <span className="font-body text-[15px] font-bold text-text-muted tabular-nums">{count}</span>
        </h2>
        <button
          type="button"
          onClick={onLink}
          className="inline-flex items-center gap-0.5 font-body font-bold text-body-md text-primary-text rounded-chip hover:underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-primary-text"
        >
          {linkLabel}
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>
      {children}
    </section>
  )
}

/** Buscar (V.4.2.0, tableta y computadora): se abre desde el buscador de la tapa del cuaderno
 *  y junta todo lo que tienes de lo buscado. Libros y sagas en el librero (como el Estante),
 *  reseñas como las hojas del Cuaderno y citas como sus notas. Busca en título, autor, el
 *  texto de las reseñas y el de las citas, sin importar tildes. Tocar un resultado abre su
 *  hoja encima; "Ver en…" lleva al Estante o al Cuaderno con la misma búsqueda. */
export function Buscar() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const rawQuery = (searchParams.get('q') ?? '').trim()
  const query = normalizeForSearch(rawQuery)
  const { user } = useAuth()
  const breakpoint = useBreakpoint()
  const { books, isLoading: booksLoading, refetch: refetchBooks } = useLibraryBooks(user?.id)
  const { sagas, isLoading: sagasLoading, refetch: refetchSagas } = useLibrarySagas(user?.id)
  const { reviews, isLoading: reviewsLoading, refetch: refetchReviews } = useReviews(user?.id)
  const { quotes, isLoading: quotesLoading, refetch: refetchQuotes } = useQuotes(user?.id)
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null)
  const [selectedSagaId, setSelectedSagaId] = useState<string | null>(null)
  const [reviewBookId, setReviewBookId] = useState<string | null>(null)

  const foundBooks = useMemo(() => (query ? books.filter((b) => matches(query, b.title, b.author)) : []), [books, query])
  const foundSagas = useMemo(() => (query ? sagas.filter((s) => matches(query, s.title, s.author)) : []), [sagas, query])
  const foundReviews = useMemo(
    () => (query ? reviews.filter((r) => matches(query, r.book.title, r.book.author, r.general_comments)) : []),
    [reviews, query]
  )
  const foundQuotes = useMemo(
    () => (query ? quotes.filter((q) => matches(query, q.quote_text, q.book.title, q.book.author)) : []),
    [quotes, query]
  )

  const isLoading = booksLoading || sagasLoading || reviewsLoading || quotesLoading
  const estanteCount = foundBooks.length + foundSagas.length
  const total = estanteCount + foundReviews.length + foundQuotes.length
  const perRow = breakpoint === 'escritorio' ? 7 : breakpoint === 'tableta' ? 5 : 3

  const parts = [
    foundBooks.length > 0 && plural(foundBooks.length, 'libro', 'libros'),
    foundSagas.length > 0 && plural(foundSagas.length, 'saga', 'sagas'),
    foundReviews.length > 0 && plural(foundReviews.length, 'reseña', 'reseñas'),
    foundQuotes.length > 0 && plural(foundQuotes.length, 'cita', 'citas'),
  ].filter(Boolean) as string[]
  const listed = parts.length > 1 ? `${parts.slice(0, -1).join(', ')} y ${parts[parts.length - 1]}` : parts[0]
  const subtitle = !rawQuery
    ? 'Escribe en el buscador de la tapa para encontrar libros, sagas, reseñas y citas.'
    : isLoading
      ? `Buscando “${rawQuery}”…`
      : total === 0
        ? `No encontramos nada con “${rawQuery}”.`
        : `Todo lo que tienes de “${rawQuery}”: ${listed}.`

  const estanteItems: ShelfItem[] = [
    ...foundBooks.map((book) => ({
      key: `libro-${book.id}`,
      title: book.title,
      subtitle: book.author ?? undefined,
      onClick: () => setSelectedBookId(book.id),
      cover: (
        <BookCover
          title={book.title}
          coverUrl={book.cover_url ?? undefined}
          status={book.status as ReadingStatus}
          isFavorite={book.is_favorite ?? false}
        />
      ),
    })),
    ...foundSagas.map((saga) => ({
      key: `saga-${saga.id}`,
      title: saga.title,
      subtitle: `Saga · ${plural(saga.bookCount, 'libro', 'libros')}`,
      onClick: () => setSelectedSagaId(saga.id),
      cover: (
        <SagaCover
          title={saga.title}
          covers={saga.covers}
          bookCount={saga.bookCount}
          status={(saga.status ?? 'pendiente') as ReadingStatus}
          isFavorite={saga.is_favorite ?? false}
        />
      ),
    })),
  ]
  const toCuaderno = (vista: 'resenas' | 'citas') =>
    navigate(`/cuaderno?${vista === 'citas' ? 'vista=citas&' : ''}buscar=${encodeURIComponent(rawQuery)}`)

  function handleTabBarChange(t: TabKey) {
    navigate(`/${t}`)
  }

  return (
    <div className="min-h-screen bg-glow-top px-4 pt-4 pagina-ancha">
      <EncabezadoAncho title="Buscar" subtitle={subtitle} entrada />

      {/* Los grupos entran escalonados SIEMPRE (V.4.3.0), no solo la primera vez en la sesión
          como las pestañas: Buscar se abre a propósito y por poco rato, así que la entrada no
          cansa. Entran cuando aparecen los primeros resultados; al seguir escribiendo, los
          grupos que ya están no se vuelven a animar, y los que aparecen nuevos sí. */}
      {!isLoading && total > 0 && (
        <div className="stagger-children">
          {estanteCount > 0 && (
            <Grupo
              title="En tu estante"
              count={estanteCount}
              linkLabel="Ver en el Estante"
              onLink={() => navigate(`/estante?buscar=${encodeURIComponent(rawQuery)}`)}
            >
              <Shelf librero perRow={perRow} items={estanteItems} />
            </Grupo>
          )}

          {foundReviews.length > 0 && (
            <Grupo title="Reseñas" count={foundReviews.length} linkLabel="Ver en el Cuaderno" onLink={() => toCuaderno('resenas')}>
              <div className="grid grid-cols-2 tableta:grid-cols-3 escritorio:grid-cols-4 gap-5 items-start">
                {foundReviews.map((r) => (
                  <ReviewCard key={r.id} review={r} large onOpen={() => setReviewBookId(r.book_id)} />
                ))}
              </div>
            </Grupo>
          )}

          {foundQuotes.length > 0 && (
            <Grupo title="Citas" count={foundQuotes.length} linkLabel="Ver en el Cuaderno" onLink={() => toCuaderno('citas')}>
              <div className="grid grid-cols-2 tableta:grid-cols-3 escritorio:grid-cols-4 gap-5 items-start">
                {foundQuotes.map((q) => (
                  // La nota de la cita, como en Cuaderno › Citas; tocarla abre la reseña del libro.
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setReviewBookId(q.book.id)}
                    aria-label={`Cita de ${q.book.title}. Ver la reseña`}
                    className="relative text-left bg-surface border border-border rounded-2xl shadow-card px-4 pt-4 pb-3 transition-transform duration-200 hover:-translate-y-0.5 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-text"
                  >
                    <span
                      aria-hidden="true"
                      className="absolute -top-px -right-px w-[22px] h-[22px] rounded-tr-2xl"
                      style={{ background: 'linear-gradient(45deg, var(--color-magenta-soft) 50%, var(--tapa-papel) 50%)' }}
                    />
                    <span aria-hidden="true" className="block h-3.5 font-title text-[30px] leading-[0.6] text-ornament">“</span>
                    <span className="block font-display italic text-[16px] leading-[1.45] text-text whitespace-pre-line mt-1">{q.quote_text}</span>
                    <span className="block mt-2.5 pt-2 border-t border-dashed border-border text-[13px]">
                      <span className="block font-bold text-text">{q.book.title}</span>
                      {q.page != null && <span className="block text-text-secondary">Pág. {q.page}</span>}
                    </span>
                  </button>
                ))}
              </div>
            </Grupo>
          )}
        </div>
      )}

      <div className="pb-24" />
      <TabBar active={null} onChange={handleTabBarChange} />

      {selectedBookId && (
        <DetalleLibro
          bookId={selectedBookId}
          onClose={() => {
            setSelectedBookId(null)
            refetchBooks()
          }}
          onDeleted={() => {
            setSelectedBookId(null)
            refetchBooks()
          }}
        />
      )}
      {selectedSagaId && (
        <DetalleSaga
          sagaId={selectedSagaId}
          onClose={() => {
            setSelectedSagaId(null)
            refetchSagas()
          }}
          onOpenBook={(bookId) => setSelectedBookId(bookId)}
          onDeleted={() => {
            setSelectedSagaId(null)
            refetchSagas()
          }}
        />
      )}
      {reviewBookId && (
        <Resena
          bookId={reviewBookId}
          onClose={() => {
            setReviewBookId(null)
            refetchReviews()
            refetchQuotes()
          }}
        />
      )}
    </div>
  )
}
