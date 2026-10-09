import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ImageOff, ArrowDownAZ, User, CalendarDays, Move } from 'lucide-react'
import { CoverImage } from '../assets/components/atoms/CoverImage'
import { useAuth } from '../hooks/useAuth'
import { useReviews, type ReviewWithBook } from '../hooks/useReviews'
import { ScreenHeader } from '../assets/components/molecules/ScreenHeader'
import { Skeleton } from '../assets/components/atoms/Skeleton'
import { RatingRow } from '../assets/components/molecules/RatingRow'
import { TabBar, type TabKey } from '../assets/components/molecules/TabBar'
import { Fab } from '../assets/components/atoms/Fab'
import { SelectReviewBookModal } from '../assets/components/molecules/SelectReviewBookModal'
import { SortMenu, type SortMenuOption } from '../assets/components/molecules/SortMenu'
import { SortableItem } from '../assets/components/atoms/SortableItem'
import { sortByMode, getStoredSortMode, setStoredSortMode, type LibrarySortMode } from '../lib/librarySort'
import { Resena } from './Resena'
import { Citas } from './cuaderno/Citas'
import { AddQuoteSheet } from '../assets/components/molecules/AddQuoteSheet'
import { ShareQuoteModal } from '../assets/components/molecules/ShareQuoteModal'
import { EditQuoteSheet } from '../assets/components/molecules/EditQuoteSheet'
import { ConfirmDialog } from '../assets/components/molecules/ConfirmDialog'
import { useQuotes, type QuoteWithBook } from '../hooks/useQuotes'
import { normalizeForSearch } from '../lib/quotes'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, rectSortingStrategy, arrayMove } from '@dnd-kit/sortable'

interface ReviewCardProps {
  review: ReviewWithBook
  onOpen: () => void
}

/** Reseña como hoja rayada (V.3.0.0): portada pequeña, título, autor y estrellas arriba; el
 *  comentario en Fraunces itálica sobre renglones con margen rosa. Toda la
 *  hoja se toca para abrir la reseña. Sin fecha: no hace falta saber cuándo se escribió. */
function ReviewCard({ review, onOpen }: ReviewCardProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Ver reseña de ${review.book.title}`}
      className="block w-full text-left bg-surface border border-border rounded-2xl shadow-card px-3 pt-3 pb-2.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-text"
    >
      <div className="grid grid-cols-[40px_1fr] gap-[9px] items-start">
        <div className="w-10 aspect-2/3 rounded-[5px] overflow-hidden bg-surface-2 shadow-[0_4px_8px_-5px_rgba(0,0,0,0.6)]">
          {review.book.cover_url ? (
            <CoverImage src={review.book.cover_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center"><ImageOff size={14} className="text-text-secondary" /></div>
          )}
        </div>
        <div className="min-w-0">
          <p className="font-display font-semibold text-[14px] leading-[1.2] text-text line-clamp-3">{review.book.title}</p>
          {review.book.author && <p className="text-[11.5px] text-text-secondary mt-px truncate">{review.book.author}</p>}
          {(review.general_rating ?? 0) > 0 && (
            <RatingRow shape="star" color="var(--color-orange)" value={review.general_rating ?? 0} size={10} className="mt-1" />
          )}
        </div>
      </div>

      {review.general_comments && (
        <p
          className="font-display italic text-[13.5px] leading-[22px] text-text mt-2 pl-2.5 border-l-2 line-clamp-3 whitespace-pre-line break-words"
          style={{
            backgroundImage: 'linear-gradient(transparent 21px, var(--color-border) 21px)',
            backgroundSize: '100% 22px',
            borderLeftColor: 'color-mix(in srgb, var(--color-rose) 55%, transparent)',
          }}
        >
          {review.general_comments}
        </p>
      )}
    </button>
  )
}

export function Cuaderno() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { reviews, isLoading, refetch, reorderReview } = useReviews(user?.id)
  const { quotes, isLoading: isLoadingQuotes, refetch: refetchQuotes, addQuote, updateQuote, removeQuote } = useQuotes(user?.id)

  // Pestaña en la URL (?vista=citas), igual que Bitácora, para que al volver se conserve.
  const [searchParams, setSearchParams] = useSearchParams()
  const tab: 'resenas' | 'citas' = searchParams.get('vista') === 'citas' ? 'citas' : 'resenas'
  const [isAddingQuote, setIsAddingQuote] = useState(false)
  const [sharingQuote, setSharingQuote] = useState<QuoteWithBook | null>(null)
  const [editingQuote, setEditingQuote] = useState<QuoteWithBook | null>(null)
  // Eliminar una cita desde su menú: la cita elegida y el paso de la confirmación.
  const [deletingQuote, setDeletingQuote] = useState<QuoteWithBook | null>(null)
  const [deleteQuoteState, setDeleteQuoteState] = useState<'confirm' | 'success' | 'error'>('confirm')

  function askDeleteQuote(quote: QuoteWithBook) {
    setDeleteQuoteState('confirm')
    setDeletingQuote(quote)
  }

  async function handleDeleteQuote() {
    if (!deletingQuote) return
    const ok = await removeQuote(deletingQuote)
    setDeleteQuoteState(ok ? 'success' : 'error')
  }

  const [search, setSearch] = useState('')
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null)
  // El modo elegido se guarda en localStorage (mismo mecanismo que Estante) para que no se
  // reinicie a "libre" cada vez que se refresca la página.
  const [sortMode, setSortModeState] = useState<LibrarySortMode>(() => getStoredSortMode('cuaderno-resenas'))
  const [isReordering, setIsReordering] = useState(false)

  function setSortMode(mode: LibrarySortMode) {
    setSortModeState(mode)
    setStoredSortMode('cuaderno-resenas', mode)
  }

  // Mismo mecanismo de activación por "mantener presionado" que ya se usa en Estante y Mesa.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  )

  const filtered = useMemo(() => {
    if (!search.trim()) return reviews
    const q = search.toLowerCase()
    return reviews.filter((r) => r.book.title.toLowerCase().includes(q) || (r.book.author ?? '').toLowerCase().includes(q))
  }, [reviews, search])

  const filteredQuotes = useMemo(() => {
    const q = normalizeForSearch(search.trim())
    if (!q) return quotes
    return quotes.filter((quote) =>
      normalizeForSearch(`${quote.quote_text} ${quote.book.title} ${quote.book.author ?? ''}`).includes(q)
    )
  }, [quotes, search])

  function changeTab(next: 'resenas' | 'citas') {
    if (next === tab) return
    setSearch('')
    setIsReordering(false)
    const params = new URLSearchParams(searchParams)
    if (next === 'citas') params.set('vista', 'citas')
    else params.delete('vista')
    setSearchParams(params, { replace: true })
  }

  const sortedReviews = useMemo(
    () =>
      sortByMode(filtered, sortMode, {
        title: (r) => r.book.title,
        author: (r) => r.book.author,
        createdAt: (r) => r.created_at,
      }),
    [filtered, sortMode]
  )

  const sortOptions: SortMenuOption<LibrarySortMode>[] = [
    { key: 'titulo', label: 'Título', icon: ArrowDownAZ },
    { key: 'autor', label: 'Autor', icon: User },
    { key: 'fecha', label: 'Fecha agregado', icon: CalendarDays },
    { key: 'libre', label: isReordering ? 'Listo' : 'Libre (arrastrar)', icon: Move },
  ]

  // Mismo criterio que en Estante: elegir "Libre" activa el arrastre; si ya se estaba en
  // "libre", volver a elegirlo apaga el arrastre (funciona como "Listo"). Cualquier otro modo
  // siempre lo apaga, porque no tiene sentido arrastrar sobre una vista ya ordenada.
  function handleSortSelect(mode: LibrarySortMode) {
    if (mode === 'libre') {
      if (sortMode === 'libre') {
        setIsReordering((v) => !v)
      } else {
        setSortMode('libre')
        setIsReordering(true)
      }
    } else {
      setSortMode(mode)
      setIsReordering(false)
    }
  }

  function handleReviewDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = sortedReviews.findIndex((r) => r.id === active.id)
    const newIndex = sortedReviews.findIndex((r) => r.id === over.id)
    const reordered = arrayMove(sortedReviews, oldIndex, newIndex)
    const droppedIndex = reordered.findIndex((r) => r.id === active.id)
    const beforeId = reordered[droppedIndex - 1]?.id ?? null
    const afterId = reordered[droppedIndex + 1]?.id ?? null
    reorderReview(active.id as string, beforeId, afterId)
  }

  function handleTabBarChange(t: TabKey) {
    navigate(`/${t}`)
  }

  return (
    <div className="min-h-screen bg-glow-top px-4 pt-4">
      <ScreenHeader
        title="Cuaderno"
        tabsLabel="Reseñas o citas"
        tabs={[
          { value: 'resenas', label: 'Reseñas', count: isLoading ? undefined : filtered.length },
          { value: 'citas', label: 'Citas', count: isLoadingQuotes ? undefined : filteredQuotes.length },
        ]}
        active={tab}
        onTabChange={changeTab}
        search={{
          value: search,
          onChange: setSearch,
          placeholder: tab === 'citas' ? 'Buscar en tus citas, título o autor' : 'Buscar por título o autor',
          actions:
            tab === 'resenas' ? (
              <SortMenu variant="bar" options={sortOptions} activeKey={sortMode} onSelect={handleSortSelect} />
            ) : undefined,
        }}
      />

      {tab === 'citas' ? (
        <Citas
          quotes={filteredQuotes}
          isFiltered={search.trim().length > 0}
          isLoading={isLoadingQuotes}
          onShare={setSharingQuote}
          onOpenBook={setSelectedBookId}
          onEdit={setEditingQuote}
          onDelete={askDeleteQuote}
        />
      ) : (
        <div className="space-y-5">
          {isReordering && (
            <p className="text-body-sm text-text-secondary text-center">
              Mantén presionado unos instantes para arrastrar y organizar tus reseñas a tu gusto.
            </p>
          )}

          {!isLoading && filtered.length === 0 && (
            <p className="text-body-md text-text-secondary text-center">Aún no tienes reseñas escritas.</p>
          )}

          {isLoading && (
            <div className="grid grid-cols-2 gap-2.5" aria-label="Cargando">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="bg-surface border border-border rounded-2xl shadow-card p-3">
                  <div className="flex gap-2.5">
                    <Skeleton className="w-10 aspect-2/3 rounded-[5px] shrink-0" />
                    <div className="flex-1">
                      <Skeleton className="h-3.5 w-full rounded-full" />
                      <Skeleton className="h-3 w-2/3 rounded-full mt-1.5" />
                    </div>
                  </div>
                  <Skeleton className="h-3 w-full rounded-full mt-4" />
                  <Skeleton className="h-3 w-4/5 rounded-full mt-3" />
                </div>
              ))}
            </div>
          )}
          {isReordering ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleReviewDragEnd}>
              <SortableContext items={sortedReviews.map((r) => r.id)} strategy={rectSortingStrategy}>
                {/* Al arrastrar se usa una cuadrícula simple de dos columnas (dnd-kit necesita
                    una sola lista); fuera de ese modo, las hojas se reparten en dos columnas. */}
                <div className="grid grid-cols-2 gap-2.5 items-start stagger-children">
                  {sortedReviews.map((r) => (
                    <SortableItem key={r.id} id={r.id}>
                      <ReviewCard review={r} onOpen={() => setSelectedBookId(r.book_id)} />
                    </SortableItem>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            // Dos columnas que se llenan alternando (1 izquierda, 2 derecha...), así el orden
            // elegido se sigue leyendo de arriba hacia abajo, igual que en Citas.
            <div className="grid grid-cols-2 gap-2.5 items-start">
              {[0, 1].map((col) => (
                <div key={col} className="flex flex-col gap-2.5 min-w-0 stagger-children">
                  {sortedReviews
                    .filter((_, i) => i % 2 === col)
                    .map((r) => (
                      <ReviewCard key={r.id} review={r} onOpen={() => setSelectedBookId(r.book_id)} />
                    ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="pb-24" />
      <Fab
        label={tab === 'citas' ? 'Agregar cita' : 'Escribir reseña nueva'}
        onClick={() => (tab === 'citas' ? setIsAddingQuote(true) : setIsPickerOpen(true))}
      />
      <TabBar active="cuaderno" onChange={handleTabBarChange} />

      <SelectReviewBookModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        userId={user?.id}
        onSelect={(bookId) => { setIsPickerOpen(false); setSelectedBookId(bookId) }}
      />

      {selectedBookId && (
        <Resena bookId={selectedBookId} onClose={() => { setSelectedBookId(null); refetch(); refetchQuotes() }} />
      )}

      {isAddingQuote && (
        <AddQuoteSheet userId={user?.id} onClose={() => setIsAddingQuote(false)} onSave={addQuote} />
      )}

      {sharingQuote && <ShareQuoteModal quote={sharingQuote} onClose={() => setSharingQuote(null)} />}

      {editingQuote && (
        <EditQuoteSheet quote={editingQuote} onClose={() => setEditingQuote(null)} onSave={updateQuote} />
      )}

      <ConfirmDialog
        isOpen={deletingQuote !== null}
        status={deleteQuoteState}
        itemLabel="cita"
        feminine
        onConfirm={handleDeleteQuote}
        onClose={() => setDeletingQuote(null)}
      />
    </div>
  )
}
