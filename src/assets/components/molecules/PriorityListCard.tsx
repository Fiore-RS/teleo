import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy, rectSortingStrategy, arrayMove } from '@dnd-kit/sortable'
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
import { CoverImage } from '../atoms/CoverImage'
import { CoverSkeleton } from '../atoms/Skeleton'
import { ShelfPlank } from './Shelf'
import { DogEar } from '../atoms/DogEar'
import type { ReadingStatus } from '../../../lib/status'

interface PriorityListCardProps {
  userId: string | undefined
  /** Tocar la portada de un libro abre Detalles del libro (V.3.0.1). */
  onOpenBook?: (bookId: string) => void
  /** 'repisa' (V.4.2.0, Perfil en computadora y tableta): la primera repisa del librero de
   *  Perfil, con el nombre de la lista en la etiqueta y el menú al lado. */
  variant?: 'card' | 'repisa'
}

/** Libros por repisa en el librero de Perfil. */
const REPISA_COLS = 7

/** "Mis próximas lecturas" (antes "Mi lista de esta temporada") como tarjeta completa: portadas en orden, menú (editar
 *  nombre, elegir uno al azar, organizar, ver en Estante), reordenamiento con mantener presionado y "Empezar a
 *  leer". Vivía en La mesa; en la fase 4 se mudó a Tu rincón (Perfil). Todo su estado va
 *  adentro para poder ubicarla en cualquier pantalla. */
export function PriorityListCard({ userId, onOpenBook, variant = 'card' }: PriorityListCardProps) {
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

  const menu = isReordering ? (
    // Mientras se organiza, el menú se cambia por un botón para terminar. El orden ya se guarda
    // al soltar cada libro; este botón solo sale del modo organizar.
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

  // Repisa del librero: cada libro con su número (como un marcapáginas) y "Empezar a leer" al
  // pasar el mouse o al llegar con el teclado. Organizar arrastra las portadas.
  const repisaCell = (book: (typeof books)[number], i: number) => (
    <div className="group relative">
      <button
        type="button"
        onClick={onOpenBook && !isReordering ? () => onOpenBook(book.id) : undefined}
        aria-label={`${i + 1}. ${book.title}`}
        className="relative block w-full aspect-2/3 rounded-[3px_6px_6px_3px] overflow-hidden bg-surface-2 shadow-[0_1px_1.5px_rgba(0,0,0,0.2),0_8px_14px_-6px_rgba(0,0,0,0.55)] transition-transform duration-200 group-hover:-translate-y-1 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FBF3EA]"
      >
        {book.cover_url ? (
          <CoverImage src={book.cover_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="w-full h-full flex items-end p-2 bg-accent-finished text-on-accent font-title text-[12px] leading-tight text-left">{book.title}</span>
        )}
        <DogEar status={(book.status ?? 'pendiente') as ReadingStatus} size={20} className="absolute top-0 right-0" />
      </button>
      <span
        aria-hidden="true"
        className="absolute -top-1 left-2 min-w-6 h-7 px-1.5 pb-1 flex items-center justify-center bg-magenta text-on-magenta font-display font-semibold text-[13px] tabular-nums shadow-[0_2px_3px_rgba(0,0,0,0.3)]"
        style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%)' }}
      >
        {i + 1}
      </span>
      {!isReordering && (
        <button
          type="button"
          onClick={() => setPendingStartId(book.id)}
          className="absolute inset-x-1.5 bottom-1.5 h-7 rounded-[7px] bg-surface/95 text-primary-text font-body font-bold text-[12px] opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-primary-text"
        >
          Empezar a leer
        </button>
      )}
    </div>
  )
  const repisaRows: (typeof books)[] = []
  for (let i = 0; i < books.length; i += REPISA_COLS) repisaRows.push(books.slice(i, i + REPISA_COLS))
  const repisaGrid = repisaRows.map((row, r) => (
    <div key={r} className={r > 0 ? 'pt-6' : ''}>
      <div className="grid gap-3.5 items-end" style={{ gridTemplateColumns: `repeat(${REPISA_COLS}, minmax(0, 1fr))` }}>
        {row.map((book, j) => {
          const i = r * REPISA_COLS + j
          return isReordering ? (
            <SortableItem key={book.id} id={book.id}>
              {repisaCell(book, i)}
            </SortableItem>
          ) : (
            <div key={book.id}>{repisaCell(book, i)}</div>
          )
        })}
      </div>
      <ShelfPlank className="-mx-5! rounded-none!" />
    </div>
  ))

  const repisa = (
    <section aria-label={listName} className="relative px-5 pt-16">
      <div className="absolute top-3 left-5 right-5 flex items-center justify-between gap-3">
        <h3 className="h-6 min-w-0 px-3 rounded-[4px] bg-magenta text-on-magenta font-body font-bold text-[13px] inline-flex items-center gap-1.5 shadow-[0_2px_4px_rgba(0,0,0,0.25)]">
          <span className="truncate">{listName}</span>
          {books.length > 0 && <span className="font-semibold opacity-80 tabular-nums">{books.length}</span>}
        </h3>
        <div className="text-[#FBF3EA]">{menu}</div>
      </div>
      {isReordering && (
        <p className="text-body-sm text-[#FBF3EA]/80 mb-3">Mantén presionado unos instantes para arrastrar y organizar tu lista.</p>
      )}
      {isLoading ? (
        <>
          <div className="grid gap-3.5 items-end" style={{ gridTemplateColumns: `repeat(${REPISA_COLS}, minmax(0, 1fr))` }} aria-label="Cargando">
            {Array.from({ length: 4 }, (_, i) => <CoverSkeleton key={i} className="w-full" />)}
          </div>
          <ShelfPlank className="-mx-5! rounded-none!" />
        </>
      ) : books.length === 0 ? (
        <>
          <div className="pb-4">
            <p className="font-display italic text-[16px] text-[#FBF3EA]/85">Elige los pendientes que quieres leer pronto y ordénalos a tu manera.</p>
            <Button variant="soft" fullWidth={false} className="mt-3 px-4" onClick={() => setIsAddBooksOpen(true)}>
              Agregar libros
            </Button>
          </div>
          <ShelfPlank className="-mx-5! rounded-none!" />
        </>
      ) : isReordering ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={books.map((b) => b.id)} strategy={rectSortingStrategy}>
            {repisaGrid}
          </SortableContext>
        </DndContext>
      ) : (
        repisaGrid
      )}
    </section>
  )

  return (
    <>
      {variant === 'repisa' ? repisa : (
      <Card
        tab={{ label: listName }}
        tone="magenta"
        action={menu}
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
      )}

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
