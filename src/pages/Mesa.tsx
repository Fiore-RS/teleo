import { Flag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useCurrentlyReading } from "../hooks/useCurrentlyReading";
import { useReadingStreak } from "../hooks/useReadingStreak";
import { useAnnualGoal } from "../hooks/useAnnualGoal";
import { getProgressInfo } from "../lib/progress";
import { SectionHeader } from "../assets/components/atoms/SectionHeader";
import { BookCardReading } from "../assets/components/molecules/BookCardReading";
import { ProgressBar } from "../assets/components/atoms/ProgressBar";
import { Button } from "../assets/components/atoms/Button";
import { TabBar, type TabKey } from "../assets/components/molecules/TabBar";
import { useState } from "react";
import { EditGoalModal } from "../assets/components/molecules/EditGoalModal";
import { getGoalMessage } from "../lib/goalMessage";
import { UpdateProgressModal } from '../assets/components/molecules/UpdateProgressModal'

export function Mesa() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { books, isLoading: booksLoading, refetch: refetchBooks } = useCurrentlyReading(user?.id)
  const { streak, markedToday, markToday } = useReadingStreak(user?.id);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const { goal, completedCount, updateGoal } = useAnnualGoal(user?.id);
  const [updatingBookId, setUpdatingBookId] = useState<string | null>(null)

  const goalPercent =
    goal > 0 ? Math.min(100, (completedCount / goal) * 100) : 0;

  function handleTabChange(tab: TabKey) {
    navigate(`/${tab}`);
  }

  return (
    <div className="min-h-screen bg-bg p-4 space-y-10">
      <section className="mt-4">
        <SectionHeader title="Leyendo ahora" variant="title" />
        <div className="space-y-3 mt-3">
          {booksLoading && (
            <p className="text-body-md text-text-secondary">Cargando...</p>
          )}
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
                onUpdateClick={() => setUpdatingBookId(book.id)}
              />
            );
          })}
        </div>
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
            variant="green"
            className="mt-4"
            onClick={markToday}
            disabled={markedToday}
          >
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