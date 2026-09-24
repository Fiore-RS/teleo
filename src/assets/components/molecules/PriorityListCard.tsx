import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Star } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { usePriorityBooks } from '../../../hooks/usePriorityBooks'
import { useProfile } from '../../../hooks/useProfile'
import { DEFAULT_PRIORITY_LIST_NAME, getPriorityListName } from '../../../lib/priorityList'
import { todayLocalDate } from '../../../lib/date'
import { queryClient } from '../../../lib/queryClient'
import { Eyebrow } from '../atoms/Eyebrow'
import { BookTileSkeleton } from '../atoms/Skeleton'
import { SortableItem } from '../atoms/SortableItem'
import { HorizontalScroller } from '../atoms/HorizontalScroller'
import { Card } from './Card'
import { BookCardPriority } from './BookCardPriority'
import { PriorityListMenu } from './PriorityListMenu'
import { EditListNameModal } from './EditListNameModal'
import { StartReadingDateModal } from './StartReadingDateModal'

interface PriorityListCardProps {
  userId: string | undefined
}

/** "Mi lista de esta temporada" como tarjeta completa: portadas en orden, menú (editar
 *  nombre, organizar, ver en Estante), reordenamiento con mantener presionado y "Empezar a
 *  leer". Vivía en La mesa; en la fase 4 se mudó a Tu rincón (Perfil). Todo su estado va
 *  adentro para poder ubicarla en cualquier pantalla. */
export function PriorityListCard({ userId }: PriorityListCardProps) {
  const navigate = useNavigate()
  const { books, isLoading, reorderBook, startReading } = usePriorityBooks(userId)
  const { profile, updateProfile } = useProfile(userId)
  const [isReordering, setIsReordering] = useState(false)
  const [isEditNameOpen, setIsEditNameOpen] = useState(false)
  const [pendingStartId, setPendingStartId] = useState<string | null>(null)

  const listName = getPriorityListName(profile?.priority_list_name)

  // Se activa con "mantener presionado" para no disparar el arrastre al hacer scroll.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { delay: 250, tolerance: 5 } }))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = books.findIndex((b) => b.id === active.id)
    const newIndex = books.findIndex((b) => b.id === over.id)
    const reordered = arrayMove(books, oldIndex, newIndex)
    const droppedIndex = reordered.findIndex((b) => b.id === active.id)
    const beforeId = reordered[droppedIndex - 1]?.id ?? null
    const afterId = reordered[droppedIndex + 1]?.id ?? null
    reorderBook(active.id as string, beforeId, afterId)
  }

  async function confirmStartReading(withStartDate: boolean) {
    if (!pendingStartId) return
    await startReading(pendingStartId, withStartDate ? todayLocalDate() : null)
    setPendingStartId(null)
    // El libro pasa a Leyendo: se refrescan Leyendo ahora, los números del perfil, etc.
    await queryClient.invalidateQueries()
  }

  const cards = books.map((book, i) => (
    <BookCardPriority
      title={book.title}
      author={book.author ?? undefined}
      coverUrl={book.cover_url ?? undefined}
      position={i + 1}
      onStartReading={() => setPendingStartId(book.id)}
    />
  ))

  return (
    <>
      <Card labelledBy="lista-temporada">
        <div className="flex items-center justify-between gap-2 mb-3.5">
          <Eyebrow id="lista-temporada" icon={Star} tone="magenta">
            {listName}
          </Eyebrow>
          {isReordering ? (
            // Mientras se organiza, el menú se cambia por un botón para terminar. El orden ya
            // se guarda al soltar cada libro; este botón solo sale del modo organizar.
            <button
              type="button"
              onClick={() => setIsReordering(false)}
              className="inline-flex items-center gap-1.5 shrink-0 rounded-full bg-magenta text-on-accent px-3.5 py-1.5 text-body-sm font-bold animate-fade-in focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-text"
            >
              <Check size={15} strokeWidth={2.5} />
              Listo
            </button>
          ) : (
            <PriorityListMenu
              isReordering={isReordering}
              canReorder={books.length > 1}
              canViewInEstante={books.length > 0}
              onEditName={() => setIsEditNameOpen(true)}
              onToggleReorder={() => setIsReordering(true)}
              onViewInEstante={() => navigate('/estante?filtro=temporada')}
            />
          )}
        </div>

        {isLoading ? (
          <div className="flex gap-4 overflow-hidden" aria-label="Cargando">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-26 shrink-0">
                <BookTileSkeleton />
              </div>
            ))}
          </div>
        ) : books.length === 0 ? (
          <p className="text-body-md text-text-secondary">
            Aún no has agregado libros a {listName}. Márcalos desde Detalle del Libro.
          </p>
        ) : isReordering ? (
          <>
            <p className="text-body-sm text-text-secondary text-center mb-3">
              Mantén presionado unos instantes para arrastrar y organizar tu lista.
            </p>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={books.map((b) => b.id)} strategy={horizontalListSortingStrategy}>
                <HorizontalScroller className="-mx-[18px] px-[18px] gap-4!">
                  {books.map((book, i) => (
                    <div key={book.id} className="w-26 shrink-0">
                      <SortableItem id={book.id} axis="x">
                        {cards[i]}
                      </SortableItem>
                    </div>
                  ))}
                </HorizontalScroller>
              </SortableContext>
            </DndContext>
          </>
        ) : (
          <HorizontalScroller className="-mx-[18px] px-[18px] gap-4!">
            {books.map((book, i) => (
              <div key={book.id} className="w-26 shrink-0">
                {cards[i]}
              </div>
            ))}
          </HorizontalScroller>
        )}
      </Card>

      {/* Fuera de la tarjeta: los diálogos no deben quedar dentro de un contenedor animado. */}
      <EditListNameModal
        isOpen={isEditNameOpen}
        onClose={() => setIsEditNameOpen(false)}
        currentName={profile?.priority_list_name ?? ''}
        defaultName={DEFAULT_PRIORITY_LIST_NAME}
        onSave={async (name) => {
          await updateProfile({ priority_list_name: name })
        }}
      />

      <StartReadingDateModal
        isOpen={pendingStartId !== null}
        onConfirm={() => confirmStartReading(true)}
        onDismiss={() => confirmStartReading(false)}
      />
    </>
  )
}
