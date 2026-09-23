import { Flag, Check, Flame, BookOpen, Star, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useCurrentlyReading } from "../hooks/useCurrentlyReading";
import { useReadingStreak } from "../hooks/useReadingStreak";
import { useAnnualGoal } from "../hooks/useAnnualGoal";
import { usePriorityBooks } from "../hooks/usePriorityBooks";
import { useProfile } from "../hooks/useProfile";
import { getProgressInfo } from "../lib/progress";
import { DEFAULT_PRIORITY_LIST_NAME, getPriorityListName } from "../lib/priorityList";
import { Eyebrow } from "../assets/components/atoms/Eyebrow";
import { Sparkle } from "../assets/components/atoms/Sparkle";
import { Skeleton, BookTileSkeleton, CoverSkeleton } from "../assets/components/atoms/Skeleton";
import { Card } from "../assets/components/molecules/Card";
import { BookCardReading } from "../assets/components/molecules/BookCardReading";
import { BookCardPriority } from "../assets/components/molecules/BookCardPriority";
import { ProgressBar } from "../assets/components/atoms/ProgressBar";
import { Button } from "../assets/components/atoms/Button";
import { TabBar, type TabKey } from "../assets/components/molecules/TabBar";
import { useState } from "react";
import { EditGoalModal } from "../assets/components/molecules/EditGoalModal";
import { EditListNameModal } from "../assets/components/molecules/EditListNameModal";
import { PriorityListMenu } from "../assets/components/molecules/PriorityListMenu";
import { UnmarkStreakModal } from "../assets/components/molecules/UnmarkStreakModal";
import { StartReadingDateModal } from "../assets/components/molecules/StartReadingDateModal";
import { SortableItem } from "../assets/components/atoms/SortableItem";
import { getGoalMessage } from "../lib/goalMessage";
import { todayLocalDate } from "../lib/date";
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
  horizontalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { HorizontalScroller } from "../assets/components/atoms/HorizontalScroller";

export function Mesa() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { books, isLoading: booksLoading, refetch: refetchBooks } = useCurrentlyReading(user?.id)
  const { streak, markedToday, markToday, unmarkToday, weekDays, isLoading: streakLoading } = useReadingStreak(user?.id);
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
  const { goal, completedCount, updateGoal, isLoading: goalLoading } = useAnnualGoal(user?.id);
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
    await startReading(pendingStartId, withStartDate ? todayLocalDate() : null)
    setPendingStartId(null)
    refetchBooks()
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";
  const dayLetters = ["L", "M", "X", "J", "V", "S", "D"];

  return (
    <div className="min-h-screen bg-glow-top px-4 pt-4">
      <header className="flex items-end justify-between gap-3 px-1 pt-4 pb-5">
        <div>
          <p className="font-body font-semibold text-body-lg text-primary-text">{greeting}</p>
          <h1 className="font-title leading-none whitespace-nowrap text-text mt-0.5">
            <span className="text-[clamp(32px,10vw,44px)]">Teleo,</span>{" "}
            <span className="text-[clamp(18px,5.5vw,26px)] text-text-secondary">a mi manera</span>
          </h1>
        </div>
        <div
          className="shrink-0 w-[58px] py-2 rounded-2xl bg-orange-soft border border-border shadow-card flex flex-col items-center gap-0.5"
          title="Racha de lectura"
          aria-label={`Racha de ${streak} días`}
        >
          <Flame size={18} className="text-orange-text" fill="currentColor" />
          {streakLoading ? (
            <Skeleton className="w-6 h-5 rounded-md" />
          ) : (
            <span key={streak} className="font-display font-semibold text-[20px] leading-none text-text animate-fade-in">{streak}</span>
          )}
        </div>
      </header>

      <div className="flex flex-col gap-5 stagger-children">
        {/* Leyendo ahora */}
        <Card labelledBy="mesa-leyendo">
          <Eyebrow id="mesa-leyendo" icon={BookOpen} className="mb-3.5">Leyendo ahora</Eyebrow>

          {booksLoading && (
            <div className="flex gap-3.5" aria-label="Cargando">
              <CoverSkeleton className="w-26 shrink-0" />
              <div className="flex-1 pt-1">
                <Skeleton className="h-5 w-4/5 rounded-full" />
                <Skeleton className="h-3.5 w-1/2 mt-2 rounded-full" />
                <Skeleton className="h-2.5 w-full mt-8 rounded-full" />
                <Skeleton className="h-8 w-full mt-3 rounded-full" />
              </div>
            </div>
          )}
          {!booksLoading && books.length === 0 && (
            <p className="text-body-md text-text-secondary">
              No tienes libros en progreso todavía.
            </p>
          )}
          <div className="divide-y divide-dashed divide-border stagger-children">
            {books.map((book) => {
              const { percent, label } = getProgressInfo(book);
              return (
                <div key={book.id} className="py-3.5 first:pt-0 last:pb-0">
                  <BookCardReading
                    title={book.title}
                    author={book.author ?? undefined}
                    coverUrl={book.cover_url ?? undefined}
                    progressPercent={percent}
                    progressLabel={label}
                    missingStartDate={!book.start_date}
                    onUpdateClick={() => setUpdatingBookId(book.id)}
                  />
                </div>
              );
            })}
          </div>
        </Card>

        {/* Mi lista de esta temporada */}
        <Card labelledBy="mesa-temporada">
          <div className="flex items-center justify-between gap-2 mb-3.5">
            <Eyebrow id="mesa-temporada" icon={Star} tone="magenta">
              {priorityListName}
            </Eyebrow>
            <PriorityListMenu
              isReordering={isPriorityReordering}
              canReorder={priorityBooks.length > 1}
              canViewInEstante={priorityBooks.length > 0}
              onEditName={() => setIsEditListNameOpen(true)}
              onToggleReorder={() => setIsPriorityReordering((v) => !v)}
              onViewInEstante={() => navigate("/estante?filtro=temporada")}
            />
          </div>

          {priorityLoading ? (
            <div className="flex gap-4 overflow-hidden" aria-label="Cargando">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-26 shrink-0">
                  <BookTileSkeleton />
                </div>
              ))}
            </div>
          ) : priorityBooks.length === 0 ? (
            <p className="text-body-md text-text-secondary">
              Aún no has agregado libros a {priorityListName}. Márcalos desde Detalle del Libro.
            </p>
          ) : (
            <>
              {isPriorityReordering && (
                <p className="text-body-sm text-text-secondary text-center mb-3">
                  Mantén presionado unos instantes para arrastrar y organizar tu lista.
                </p>
              )}

              {isPriorityReordering ? (
                <DndContext sensors={prioritySensors} collisionDetection={closestCenter} onDragEnd={handlePriorityDragEnd}>
                  <SortableContext items={priorityBooks.map((b) => b.id)} strategy={horizontalListSortingStrategy}>
                    <HorizontalScroller className="-mx-[18px] px-[18px] gap-4!">
                      {priorityBooks.map((book, i) => (
                        <div key={book.id} className="w-26 shrink-0">
                          <SortableItem id={book.id} axis="x">
                            <BookCardPriority
                              title={book.title}
                              author={book.author ?? undefined}
                              coverUrl={book.cover_url ?? undefined}
                              position={i + 1}
                              onStartReading={() => setPendingStartId(book.id)}
                            />
                          </SortableItem>
                        </div>
                      ))}
                    </HorizontalScroller>
                  </SortableContext>
                </DndContext>
              ) : (
                <HorizontalScroller className="-mx-[18px] px-[18px] gap-4!">
                  {priorityBooks.map((book, i) => (
                    <div key={book.id} className="w-26 shrink-0">
                      <BookCardPriority
                        title={book.title}
                        author={book.author ?? undefined}
                        coverUrl={book.cover_url ?? undefined}
                        position={i + 1}
                        onStartReading={() => setPendingStartId(book.id)}
                      />
                    </div>
                  ))}
                </HorizontalScroller>
              )}
            </>
          )}
        </Card>

        {/* Racha diaria */}
        <Card labelledBy="mesa-racha" tint="orange">
          <Eyebrow id="mesa-racha" icon={Flag} tone="orange" className="mb-3.5">
            Racha diaria de lectura
          </Eyebrow>

          <div className="flex items-center gap-4">
            <div className="relative w-[74px] h-[74px] shrink-0 flex items-center justify-center">
              <span className="absolute inset-0 rounded-full border-[1.5px] border-dashed border-ornament" />
              <span className="absolute top-1.5 right-1.5 w-[7px] h-[7px] rounded-full bg-rose" />
              <span className="w-[50px] h-[50px] rounded-full bg-orange-soft text-orange flex items-center justify-center">
                <Flame size={24} fill="currentColor" />
              </span>
            </div>
            {streakLoading ? (
              <div className="flex-1">
                <Skeleton className="h-7 w-2/3 rounded-full" />
                <Skeleton className="h-3.5 w-11/12 mt-2.5 rounded-full" />
              </div>
            ) : (
            <div>
              <p className="font-display font-semibold text-[28px] leading-none text-text">
                <span key={streak} className="inline-block animate-fade-in">{streak}</span>{" "}
                <span className="font-body font-medium text-body-md text-text-secondary">días seguidos</span>
              </p>
              <p className="text-body-md text-text-secondary mt-1">
                {markedToday ? "Sesión de hoy marcada." : "Todavía no marcas la sesión de hoy."}
              </p>
            </div>
            )}
          </div>

          {weekDays.length > 0 && (
            <ol className={`grid grid-cols-7 gap-1.5 my-4 ${streakLoading ? "animate-skeleton" : ""}`} aria-label="Esta semana">
              {weekDays.map((d, i) => (
                <li
                  key={d.date}
                  className={`flex flex-col items-center gap-1 text-[11px] font-semibold ${
                    d.isToday ? "text-primary-text" : "text-text-muted"
                  } ${d.isFuture ? "opacity-50" : ""}`}
                >
                  <span
                    className={`w-[26px] h-[26px] rounded-full border-[1.5px] flex items-center justify-center ${
                      d.read
                        ? "bg-orange border-orange text-on-accent"
                        : d.isToday
                          ? "border-dashed border-primary-text bg-surface-2"
                          : "border-border bg-surface-2"
                    }`}
                  >
                    {d.read && <Check size={12} strokeWidth={3.5} />}
                  </span>
                  {dayLetters[i]}
                </li>
              ))}
            </ol>
          )}

          <Button
            variant={markedToday ? "outlineOrange" : "orange"}
            className={weekDays.length > 0 ? "" : "mt-4"}
            onClick={() => (markedToday ? setIsUnmarkOpen(true) : markToday())}
          >
            {markedToday && <Check size={18} strokeWidth={2.5} />}
            {markedToday ? "Sesión de hoy marcada" : "Marcar sesión de hoy"}
          </Button>
        </Card>

        {/* Meta anual */}
        <Card labelledBy="mesa-meta" tint="pink">
          <Eyebrow id="mesa-meta" icon={Target} tone="pink" className="mb-3.5">Meta anual de lectura</Eyebrow>
          {goalLoading ? (
            <div aria-label="Cargando">
              <Skeleton className="h-7 w-3/5 rounded-full" />
              <Skeleton className="h-3 w-full mt-4 rounded-full" />
              <Skeleton className="h-3.5 w-1/2 mx-auto mt-3.5 mb-3.5 rounded-full" />
            </div>
          ) : (
          <>
          <div className="flex items-baseline justify-between gap-3">
            <p className="font-display font-semibold text-[28px] leading-none text-text">
              <span key={completedCount} className="inline-block animate-fade-in">{completedCount}</span>{" "}
              <span className="font-body font-medium text-body-md text-text-secondary">
                de {goal} libros del {new Date().getFullYear()}
              </span>
            </p>
            <span className="font-display font-semibold text-pink-text tabular-nums">
              {Math.round(goalPercent)}%
            </span>
          </div>
          <ProgressBar percent={goalPercent} color="var(--color-pink)" className="mt-3 h-3" />
          <p className="text-body-md text-text-secondary text-center mt-2.5 mb-3.5">
            {getGoalMessage(goalPercent)}
          </p>
          </>
          )}
          <div className="flex items-center gap-2.5 text-ornament mb-3.5" aria-hidden="true">
            <span className="flex-1 h-px bg-border" />
            <Sparkle size={10} />
            <span className="flex-1 h-px bg-border" />
          </div>
          <Button variant="soft" onClick={() => setIsGoalModalOpen(true)}>
            Editar meta
          </Button>
        </Card>
      </div>

      <div className="pb-28" />
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