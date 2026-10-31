import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookPlus, Check } from 'lucide-react'
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
import { queryClient } from '../../../lib/queryClient'
import { BookTileSkeleton } from '../atoms/Skeleton'
import { SortableItem } from '../atoms/SortableItem'
import { HorizontalScroller } from '../atoms/HorizontalScroller'
import { Card } from './Card'
import { BookCardPriority } from './BookCardPriority'
import { PriorityListMenu } from './PriorityListMenu'
import { EditListNameModal } from './EditListNameModal'
import { StartReadingDateModal } from './StartReadingDateModal'
import { RandomPickSheet } from './RandomPickSheet'
import { NextReadsSheet } from './NextReadsSheet'
import { Button } from '../atoms/Button'

interface PriorityListCardProps {
  userId: string | undefined
  /** Tocar la portada de un libro abre Detalles del libro (V.3.0.1). */
  onOpenBook?: (bookId: string) => void
}

/** "Mis próximas lecturas" (antes "Mi lista de esta temporada") como tarjeta completa: portadas en orden, menú (editar
 *  nombre, elegir uno al azar, organizar, ver en Estante), reordenamiento con mantener presionado y "Empezar a
 *  leer". Vivía en La mesa; en la fase 4 se mudó a Tu rincón (Perfil). Todo su estado va
 *  adentro para poder ubicarla en cualquier pantalla. */
export function PriorityListCard({ userId, onOpenBook }: PriorityListCardProps) {
  const navigate = useNavigate()
  const { books, isLoading, reorderBook, startReading, saveListBooks } = usePriorityBooks(userId)
  const { profile, updateProfile } = useProfile(userId)
  const [isReordering, setIsReordering] = useState(false)
  const [isEditNameOpen, setIsEditNameOpen] = useState(false)
  const [pendingStartId, setPendingStartId] = useState<string | null>(null)
  const [isRandomPickOpen, setIsRandomPickOpen] = useState(false)
  const [isAddBooksOpen, setIsAddBooksOpen] = useState(false)

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

  async function confirmStartReading(startDate: string | null) {
    if (!pendingStartId) return
    await startReading(pendingStartId, startDate)
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
      onOpen={onOpenBook && !isReordering ? () => onOpenBook(book.id) : undefined}
    />
  ))

  return (
    <>
      <Card
        tab={{ label: listName }}
        tone="magenta"
        action={
          isReordering ? (
              // Mientras se organiza, el menú se cambia por un botón para terminar. El orden ya
              // se guarda al soltar cada libro; este botón solo sale del modo organizar.
              <button
                type="button"
                onClick={() => setIsReordering(false)}
                className="inline-flex items-center gap-1.5 shrink-0 h-7 rounded-chip bg-magenta text-on-magenta px-3.5 text-body-sm font-bold animate-fade-in focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-text"
              >
                <Check size={15} strokeWidth={2.5} />
                Listo
              </button>
            ) : (
              <PriorityListMenu
                isReordering={isReordering}
                canReorder={books.length > 1}
                canViewInEstante={books.length > 0}
                canPickRandom={books.length > 1}
                onAddBooks={() => setIsAddBooksOpen(true)}
                onEditName={() => setIsEditNameOpen(true)}
                onPickRandom={() => setIsRandomPickOpen(true)}
                onToggleReorder={() => setIsReordering(true)}
                onViewInEstante={() => navigate('/estante?filtro=temporada')}
              />
            )
        }
      >

        {isLoading ? (
          <div className="flex gap-4 overflow-hidden" aria-label="Cargando">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-26 shrink-0">
                <BookTileSkeleton />
              </div>
            ))}
          </div>
        ) : books.length === 0 ? (
          <>
            <p className="text-body-md text-text-secondary">
              Elige los pendientes que quieres leer pronto y ordénalos a tu manera.
            </p>
            <Button variant="soft" className="mt-3.5" onClick={() => setIsAddBooksOpen(true)}>
              <BookPlus size={16} />
              Agregar libros
            </Button>
          </>
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

      {isAddBooksOpen && (
        <NextReadsSheet userId={userId} onClose={() => setIsAddBooksOpen(false)} onSave={saveListBooks} />
      )}

      {isRandomPickOpen && (
        <RandomPickSheet userId={userId} initialSource="temporada" onClose={() => setIsRandomPickOpen(false)} />
      )}

      <StartReadingDateModal
        isOpen={pendingStartId !== null}
        book={books.find((b) => b.id === pendingStartId)}
        onConfirm={(startDate) => confirmStartReading(startDate)}
        onDismiss={() => confirmStartReading(null)}
      />
    </>
  )
}
