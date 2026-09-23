import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ImageOff, ArrowDownAZ, User, CalendarDays, Move, Plus, Search } from 'lucide-react'
import { CoverImage } from '../assets/components/atoms/CoverImage'
import { useAuth } from '../hooks/useAuth'
import { useReviews, type ReviewWithBook } from '../hooks/useReviews'
import { SearchHeader } from '../assets/components/molecules/SearchHeader'
import { BookTileSkeleton } from '../assets/components/atoms/Skeleton'
import { RatingRow } from '../assets/components/molecules/RatingRow'
import { TabBar, type TabKey } from '../assets/components/molecules/TabBar'
import { ScrollToTopButton } from '../assets/components/atoms/ScrollToTopButton'
import { SelectReviewBookModal } from '../assets/components/molecules/SelectReviewBookModal'
import { SortMenu, type SortMenuOption } from '../assets/components/molecules/SortMenu'
import { SortableItem } from '../assets/components/atoms/SortableItem'
import { sortByMode, getStoredSortMode, setStoredSortMode, type LibrarySortMode } from '../lib/librarySort'
import { Resena } from './Resena'
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

/** Reseña en la cuadrícula de El cuaderno. Rediseño 2026: mismo patrón que las portadas de
 *  El estante (sin tarjeta propia, toda la pieza se toca para abrir la reseña) y el
 *  comentario como una citita en Fraunces itálica. */
function ReviewCard({ review, onOpen }: ReviewCardProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Ver reseña de ${review.book.title}`}
      className="text-left w-full flex flex-col rounded-[10px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-text"
    >
      <div className="relative aspect-2/3 w-full rounded-[10px] overflow-hidden bg-surface-2 shadow-[0_6px_14px_-8px_rgba(60,30,10,0.5)]">
        {review.book.cover_url ? (
          <CoverImage src={review.book.cover_url ?? undefined} alt={review.book.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><ImageOff size={18} className="text-text-secondary" /></div>
        )}
      </div>

      <p className="text-body-md font-semibold leading-tight text-text line-clamp-2 mt-2">{review.book.title}</p>
      <p className="text-body-sm text-text-secondary line-clamp-1 mt-0.5">{review.book.author}</p>

      <RatingRow shape="star" color="var(--color-orange)" value={review.general_rating ?? 0} size={12} className="mt-1.5" />

      {review.general_comments && (
        <p className="font-display italic text-body-sm leading-snug text-text-secondary line-clamp-3 mt-2 bg-surface border border-border rounded-xl px-2.5 py-2">
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

  const [search, setSearch] = useState('')
  const [isSearching, setIsSearching] = useState(false)
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
      <SearchHeader
        isSearching={isSearching}
        onCancel={() => {
          setSearch('')
          setIsSearching(false)
        }}
        value={search}
        onChange={setSearch}
        placeholder="Buscar por título o autor"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <h1 className="h-9 min-[400px]:h-10 flex items-center font-title text-[clamp(30px,8.5vw,44px)] leading-none text-text whitespace-nowrap">
              Cuaderno
            </h1>
            <div className="flex items-start gap-1.5 min-[400px]:gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsSearching(true)}
                aria-label="Buscar"
                className="w-9 h-9 min-[400px]:w-10 min-[400px]:h-10 shrink-0 rounded-full bg-surface border border-border shadow-card text-primary-text flex items-center justify-center focus-visible:outline-2 focus-visible:outline-primary-text"
              >
                <Search size={17} />
              </button>
              <SortMenu variant="icon" options={sortOptions} activeKey={sortMode} onSelect={handleSortSelect} />
              <button
                type="button"
                onClick={() => setIsPickerOpen(true)}
                aria-label="Escribir reseña nueva"
                className="w-11 h-11 min-[400px]:w-12 min-[400px]:h-12 -mb-2 shrink-0 rounded-full bg-primary text-primary-ink shadow-card flex items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-text"
              >
                <Plus size={24} strokeWidth={2.4} />
              </button>
            </div>
          </div>
          <p className="font-body text-body-md text-text-secondary mt-1.5 tabular-nums">
            {isLoading ? '\u00a0' : `${filtered.length} ${filtered.length === 1 ? 'reseña' : 'reseñas'}`}
          </p>
        </div>
      </SearchHeader>

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
          <div className="grid grid-cols-3 gap-x-3 gap-y-4" aria-label="Cargando">
            {Array.from({ length: 6 }, (_, i) => (
              <BookTileSkeleton key={i} />
            ))}
          </div>
        )}
        {isReordering ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleReviewDragEnd}>
            <SortableContext items={sortedReviews.map((r) => r.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-3 gap-x-3 gap-y-5 items-start stagger-children">
                {sortedReviews.map((r) => (
                  <SortableItem key={r.id} id={r.id}>
                    <ReviewCard review={r} onOpen={() => setSelectedBookId(r.book_id)} />
                  </SortableItem>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="grid grid-cols-3 gap-x-3 gap-y-5 items-start stagger-children">
            {sortedReviews.map((r) => (
              <ReviewCard key={r.id} review={r} onOpen={() => setSelectedBookId(r.book_id)} />
            ))}
          </div>
        )}
      </div>

      <div className="pb-24" />
      <ScrollToTopButton />
      <TabBar active="cuaderno" onChange={handleTabBarChange} />

      <SelectReviewBookModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        userId={user?.id}
        onSelect={(bookId) => { setIsPickerOpen(false); setSelectedBookId(bookId) }}
      />

      {selectedBookId && (
        <Resena bookId={selectedBookId} onClose={() => { setSelectedBookId(null); refetch() }} />
      )}
    </div>
  )
}
