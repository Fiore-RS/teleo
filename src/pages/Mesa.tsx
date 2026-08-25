import { Flag, Check, ArrowUpDown, Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useCurrentlyReading } from "../hooks/useCurrentlyReading";
import { useReadingStreak } from "../hooks/useReadingStreak";
import { useAnnualGoal } from "../hooks/useAnnualGoal";
import { usePriorityBooks } from "../hooks/usePriorityBooks";
import { useProfile } from "../hooks/useProfile";
import { getProgressInfo } from "../lib/progress";
import { DEFAULT_PRIORITY_LIST_NAME, getPriorityListName } from "../lib/priorityList";
import { SectionHeader } from "../assets/components/atoms/SectionHeader";
import { BookCardReading } from "../assets/components/molecules/BookCardReading";
import { BookCardPriority } from "../assets/components/molecules/BookCardPriority";
import { ProgressBar } from "../assets/components/atoms/ProgressBar";
import { Button } from "../assets/components/atoms/Button";
import { TabBar, type TabKey } from "../assets/components/molecules/TabBar";
import { useState } from "react";
import { EditGoalModal } from "../assets/components/molecules/EditGoalModal";
import { EditListNameModal } from "../assets/components/molecules/EditListNameModal";
import { UnmarkStreakModal } from "../assets/components/molecules/UnmarkStreakModal";
import { StartReadingDateModal } from "../assets/components/molecules/StartReadingDateModal";
import { SortableItem } from "../assets/components/atoms/SortableItem";
import { getGoalMessage } from "../lib/goalMessage";
import { UpdateProgressModal } from '../assets/components/molecules/UpdateProgressModal'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";

export function Mesa() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { books, isLoading: booksLoading, refetch: refetchBooks } = useCurrentlyReading(user?.id)
  const { streak, markedToday, markToday, unmarkToday } = useReadingStreak(user?.id);
  const {
    books: priorityBooks,
    isLoading: priorityLoading,
    reorderBook: reorderPriorityBook,
    startReading,
  } = usePriorityBooks(user?.id)
  const { profile, updateProfile } = useProfile(user?.id)
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isUnmarkOpen, setIsUnmarkOpen] = useState(false);
  const [isPriorityReordering, setIsPriorityReordering] = useState(false)
  const [pendingStartId, setPendingStartId] = useState<string | null>(null)
  const [isEditListNameOpen, setIsEditListNameOpen] = useState(false)
  const { goal, completedCount, updateGoal } = useAnnualGoal(user?.id);
  const [updatingBookId, setUpdatingBookId] = useState<string | null>(null)

  const priorityListName = getPriorityListName(profile?.priority_list_name)

  const goalPercent =
    goal > 0 ? Math.min(100, (completedCount / goal) * 100) : 0;

  // Mismo mecanismo de activación por "mantener presionado" que ya se usa en Estante, para
  // no disparar el drag con un gesto normal de scroll.
  const prioritySensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  function handleTabChange(tab: TabKey) {
    navigate(`/${tab}`);
  }

  function handlePriorityDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = priorityBooks.findIndex((b) => b.id === active.id)
    const newIndex = priorityBooks.findIndex((b) => b.id === over.id)
    const reordered = arrayMove(priorityBooks, oldIndex, newIndex)
    const droppedIndex = reordered.findIndex((b) => b.id === active.id)
    const beforeId = reordered[droppedIndex - 1]?.id ?? null
    const afterId = reordered[droppedIndex + 1]?.id ?? null
    reorderPriorityBook(active.id as string, beforeId, afterId)
  }

  async function confirmStartReading(withStartDate: boolean) {
    if (!pendingStartId) return
    await startReading(pendingStartId, withStartDate ? new Date().toISOString().slice(0, 10) : null)
    setPendingStartId(null)
    refetchBooks()
  }

  return (
    <div className="min-h-screen bg-bg p-4 space-y-10">
      <section className="mt-4">
        <SectionHeader title="Leyendo ahora" variant="title" />
        <div className="space-y-3 mt-3">
          {!booksLoading && books.length === 0 && (
            <p className="text-body-md text-text-secondary">
              No tienes libros en progreso todavía.
            </p>
          )}
          {books.map((book) => {
            const { percent, label } = getProgressInfo(book);
            return (
              <BookCardReading
                key={book.id}
                title={book.title}
                author={book.author ?? undefined}
                coverUrl={book.cover_url ?? undefined}
                progressPercent={percent}
                progressLabel={label}
                missingStartDate={!book.start_date}
                onUpdateClick={() => setUpdatingBookId(book.id)}
              />
            );
          })}
        </div>
      </section>

      <section>
        <SectionHeader
          title={priorityListName}
          variant="title"
          rightContent={
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsEditListNameOpen(true)}
                aria-label="Editar nombre de la lista"
              >
                <Pencil size={14} />
              </button>
              {priorityBooks.length > 0 && (
                <button
                  onClick={() => navigate("/estante?filtro=temporada")}
                  className="underline underline-offset-2"
                >
                  Ver en Estante
                </button>
              )}
            </div>
          }
        />

        {!priorityLoading && priorityBooks.length === 0 ? (
          <p className="text-body-md text-text-secondary mt-3">
            Aún no has agregado libros a {priorityListName}. Márcalos desde Detalle del Libro.
          </p>
        ) : (
          <>
            {priorityBooks.length > 1 && (
              <button
                onClick={() => setIsPriorityReordering((v) => !v)}
                className="mt-3 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-body-sm font-body text-surface"
                style={{ backgroundColor: "var(--color-state-pending)" }}
              >
                <ArrowUpDown size={14} />
                {isPriorityReordering ? "Listo" : "Organizar"}
              </button>
            )}
            {isPriorityReordering && (
              <p className="text-body-sm text-text-secondary text-center mt-2">
                Mantén presionado unos instantes para arrastrar y organizar tu lista.
              </p>
            )}

            {isPriorityReordering ? (
              <DndContext sensors={prioritySensors} collisionDetection={closestCenter} onDragEnd={handlePriorityDragEnd}>
                <SortableContext items={priorityBooks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-3 mt-3">
                    {priorityBooks.map((book) => (
                      <SortableItem key={book.id} id={book.id}>
                        <BookCardPriority
                          title={book.title}
                          author={book.author ?? undefined}
                          coverUrl={book.cover_url ?? undefined}
                          onStartReading={() => setPendingStartId(book.id)}
                        />
                      </SortableItem>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <div className="space-y-3 mt-3">
                {priorityBooks.map((book) => (
                  <BookCardPriority
                    key={book.id}
                    title={book.title}
                    author={book.author ?? undefined}
                    coverUrl={book.cover_url ?? undefined}
                    onStartReading={() => setPendingStartId(book.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </section>

      <section>
        <SectionHeader title="Racha diaria de lectura" variant="title" />
        <div className="bg-surface border border-border rounded-2xl p-6 mt-3 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-accent-finished flex items-center justify-center mb-3">
            <Flag size={22} className="text-surface" />
          </div>
          <p className="font-body text-body-lg text-text font-semibold">
            {streak} días seguidos
          </p>
          <Button
            variant={markedToday ? "outline" : "green"}
            className="mt-4"
            onClick={() => (markedToday ? setIsUnmarkOpen(true) : markToday())}
          >
            {markedToday && <Check size={18} strokeWidth={2.5} />}
            {markedToday ? "Sesión de hoy marcada" : "Marcar sesión de hoy"}
          </Button>
        </div>
      </section>

      <section>
        <SectionHeader title="Meta anual de lectura" variant="title" />
        <div className="bg-surface border border-border rounded-2xl p-6 mt-3 text-center">
          <p className="font-display text-display-lg text-text">
            {completedCount} de {goal}
          </p>
          <p className="text-body-md text-text-secondary">
            libros del {new Date().getFullYear()}
          </p>
          <ProgressBar percent={goalPercent} className="mt-4" />
          <p className="text-body-sm text-text-secondary mt-2">
            {getGoalMessage(goalPercent)}
          </p>
          <Button
            variant="amber"
            className="mt-4"
            onClick={() => setIsGoalModalOpen(true)}
          >
            Editar Meta
          </Button>
        </div>
      </section>

      <p className="text-center font-handwritten text-hand-lg text-text-secondary italic px-4">
        "El que lee mucho y anda mucho, ve mucho y sabe mucho"
      </p>

      <div className="pb-10" />
      <TabBar active="mesa" onChange={handleTabChange} />

      <EditGoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        currentGoal={goal}
        onSave={updateGoal}
      />

      <UnmarkStreakModal
        isOpen={isUnmarkOpen}
        onConfirm={async () => {
          setIsUnmarkOpen(false)
          await unmarkToday()
        }}
        onDismiss={() => setIsUnmarkOpen(false)}
      />

      <EditListNameModal
        isOpen={isEditListNameOpen}
        onClose={() => setIsEditListNameOpen(false)}
        currentName={profile?.priority_list_name ?? ""}
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

      {updatingBookId && (
  <UpdateProgressModal
    bookId={updatingBookId}
    onClose={() => setUpdatingBookId(null)}
    onUpdated={refetchBooks}
  />
)}
    </div>
  );
}