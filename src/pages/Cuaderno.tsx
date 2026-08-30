import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ImageOff, ArrowDownAZ, User, CalendarDays, Move } from 'lucide-react'
import { CoverImage } from '../assets/components/atoms/CoverImage'
import { useAuth } from '../hooks/useAuth'
import { useReviews, type ReviewWithBook } from '../hooks/useReviews'
import { SearchBar } from '../assets/components/molecules/SearchBar'
import { SectionHeader } from '../assets/components/atoms/SectionHeader'
import { Button } from '../assets/components/atoms/Button'
import { RatingRow } from '../assets/components/molecules/RatingRow'
import { TabBar, type TabKey } from '../assets/components/molecules/TabBar'
import { ScrollToTopButton } from '../assets/components/atoms/ScrollToTopButton'
import { SelectReviewBookModal } from '../assets/components/molecules/SelectReviewBookModal'
import { SortMenu, type SortMenuOption } from '../assets/components/molecules/SortMenu'
import { SortableItem } from '../assets/components/atoms/SortableItem'
import { sortByMode, type LibrarySortMode } from '../lib/librarySort'
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

function ReviewCard({ review, onOpen }: ReviewCardProps) {
  return (
    <div className="bg-surface border border-border rounded-xl p-2.5 flex flex-col">
      <div className="relative aspect-2/3 w-full rounded-lg overflow-hidden bg-border">
        {review.book.cover_url ? (
          <CoverImage src={review.book.cover_url ?? undefined} alt={review.book.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><ImageOff size={18} className="text-text-secondary" /></div>
        )}
      </div>

      <p className="text-body-sm text-text line-clamp-2 mt-1.5">{review.book.title}</p>
      <p className="text-body-sm text-text-secondary line-clamp-1 mt-0.5">{review.book.author}</p>

      <RatingRow shape="star" color="var(--color-accent-reading)" value={review.general_rating ?? 0} size={12} className="mt-1.5" />

      {review.general_comments && (
        <p className="text-body-sm text-text-secondary line-clamp-2 mt-1.5 bg-bg rounded-lg p-2">
          {review.general_comments}
        </p>
      )}

      <Button variant="amber" className="mt-2 w-full py-2! text-body-sm!" onClick={onOpen}>
        Ver Reseña
      </Button>
    </div>
  )
}

export function Cuaderno() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { reviews, isLoading, refetch, reorderReview } = useReviews(user?.id)

  const [search, setSearch] = useState('')
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null)
  const [sortMode, setSortMode] = useState<LibrarySortMode>('libre')
  const [isReordering, setIsReordering] = useState(false)

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
    <div className="min-h-screen bg-bg p-4">
      <div className="mt-4 space-y-6">
        <SectionHeader title="Tu diario de lectura" rightContent={`${String(filtered.length).padStart(3, '0')} reseñas`} />

        <SearchBar value={search} onChange={(e) => setSearch(e.target.value)} />

        <Button variant="primary" onClick={() => setIsPickerOpen(true)}>Agregar Reseña Nueva</Button>

        <SortMenu options={sortOptions} activeKey={sortMode} onSelect={handleSortSelect} />

        {isReordering && (
          <p className="text-body-sm text-text-secondary text-center">
            Mantén presionado unos instantes para arrastrar y organizar tus reseñas a tu gusto.
          </p>
        )}

        {!isLoading && filtered.length === 0 && (
          <p className="text-body-md text-text-secondary text-center">Aún no tienes reseñas escritas.</p>
        )}

        {isReordering ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleReviewDragEnd}>
            <SortableContext items={sortedReviews.map((r) => r.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-3 gap-2.5">
                {sortedReviews.map((r) => (
                  <SortableItem key={r.id} id={r.id}>
                    <ReviewCard review={r} onOpen={() => setSelectedBookId(r.book_id)} />
                  </SortableItem>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="grid grid-cols-3 gap-2.5">
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
