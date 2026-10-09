import { Flag, Check, Flame, BookOpen, Target, Shuffle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useCurrentlyReading } from "../hooks/useCurrentlyReading";
import { useReadingStreak } from "../hooks/useReadingStreak";
import { useAnnualGoal } from "../hooks/useAnnualGoal";
import { useProfile } from "../hooks/useProfile";
import { getProgressInfo } from "../lib/progress";
import { StreakRibbon } from "../assets/components/atoms/StreakRibbon";
import { Sparkle } from "../assets/components/atoms/Sparkle";
import { Skeleton, CoverSkeleton } from "../assets/components/atoms/Skeleton";
import { Card, CardAction } from "../assets/components/molecules/Card";
import { BookCardReading } from "../assets/components/molecules/BookCardReading";
import { ProgressBar } from "../assets/components/atoms/ProgressBar";
import { Button } from "../assets/components/atoms/Button";
import { TabBar, type TabKey } from "../assets/components/molecules/TabBar";
import { useEffect, useState } from "react";
import { EditGoalModal } from "../assets/components/molecules/EditGoalModal";
import { UnmarkStreakModal } from "../assets/components/molecules/UnmarkStreakModal";
import { RandomPickSheet } from "../assets/components/molecules/RandomPickSheet";
import { ReadingCalendarSheet } from "../assets/components/molecules/ReadingCalendarSheet";
import { NextReleaseCard } from "../assets/components/molecules/NextReleaseCard";
import { AnnouncementSheet } from "../assets/components/molecules/AnnouncementSheet";
import { ANNOUNCEMENT_VERSION, isVersionBefore, missedAnnouncedVersions } from "../lib/announcement";
import { LATEST_VERSION, markChangelogSeen } from "../lib/changelog";
import { getGoalMessage } from "../lib/goalMessage";
import { UpdateProgressModal } from '../assets/components/molecules/UpdateProgressModal'
import { getReadingPace, paceSentence } from '../lib/readingPace'
export function Mesa() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { books, isLoading: booksLoading, refetch: refetchBooks } = useCurrentlyReading(user?.id)
  const { streak, markedToday, markToday, unmarkToday, weekDays, isLoading: streakLoading } = useReadingStreak(user?.id);
  const { profile, updateProfile } = useProfile(user?.id)
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isUnmarkOpen, setIsUnmarkOpen] = useState(false);
  const { goal, completedCount, updateGoal, isLoading: goalLoading } = useAnnualGoal(user?.id);
  const [updatingBookId, setUpdatingBookId] = useState<string | null>(null)
  const [isRandomPickOpen, setIsRandomPickOpen] = useState(false)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  // La cinta de la racha baja con rebote cuando la sesión de hoy pasa de sin marcar a
  // marcada (no al cargar la pantalla). Se compara con el valor anterior durante el render.
  const [dropKey, setDropKey] = useState(0)
  const [prevMarked, setPrevMarked] = useState<boolean | null>(null)
  if (!streakLoading && markedToday !== prevMarked) {
    if (prevMarked === false && markedToday) setDropKey((k) => k + 1)
    setPrevMarked(markedToday)
  }
  // Anuncio de la V.2.0.0: una sola vez por cuenta (se guarda en el perfil). Las cuentas
  // nuevas lo marcan como visto al terminar la Bienvenida.
  const [announcementDismissed, setAnnouncementDismissed] = useState(false)
  // Última versión que la persona había visto al entrar (V.2.1.2). Se fija una sola vez,
  // porque la versión guardada en el perfil se actualiza apenas entra.
  const [seenAtEntry, setSeenAtEntry] = useState<string | null | undefined>(undefined)
  if (profile && seenAtEntry === undefined) setSeenAtEntry(profile.last_seen_version ?? null)
  const showAnnouncement =
    !announcementDismissed && !!profile?.has_seen_intro && seenAtEntry !== undefined && isVersionBefore(seenAtEntry, ANNOUNCEMENT_VERSION)
  const missedVersions = showAnnouncement ? missedAnnouncedVersions(seenAtEntry) : []

  // Se guarda la versión con la que entra, para saber exacto cuál fue la última que vio. Si
  // hay un anuncio pendiente, se guarda al cerrarlo (así no se pierde si cierra la app antes).
  const needsVersionUpdate =
    !!profile?.has_seen_intro && !showAnnouncement && !announcementDismissed && isVersionBefore(profile.last_seen_version, LATEST_VERSION)
  useEffect(() => {
    if (needsVersionUpdate) updateProfile({ last_seen_version: LATEST_VERSION })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsVersionUpdate])

  function handleAnnouncementDone() {
    setAnnouncementDismissed(true)
    markChangelogSeen()
    updateProfile({ last_seen_version: LATEST_VERSION })
  }

  // "Ver todas las novedades" del aviso de novedades acumuladas: cierra la hoja y abre
  // Novedades marcando lo que no había visto.
  function handleSeeAllNews() {
    handleAnnouncementDone()
    navigate("/configuracion/novedades", { state: { since: seenAtEntry ?? null } })
  }

  const goalPercent =
    goal > 0 ? Math.min(100, (completedCount / goal) * 100) : 0;

  function handleTabChange(tab: TabKey) {
    navigate(`/${tab}`);
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";
  const dayLetters = ["L", "M", "X", "J", "V", "S", "D"];

  return (
    <div className="relative min-h-screen bg-glow-top px-4 pt-4">
      <StreakRibbon
        streak={streak}
        marked={markedToday}
        isLoading={streakLoading}
        dropKey={dropKey}
        onClick={() => setIsCalendarOpen(true)}
      />

      {/* pr-16: deja libre el lugar de la cinta. */}
      <header className="px-1 pr-16 pt-4 pb-5">
        <p className="font-body font-semibold text-body-lg text-primary-text mb-1">
          {profile?.nickname ? `${greeting}, ${profile.nickname}` : greeting}
        </p>
        <h1 className="font-title leading-none tracking-[-0.01em] whitespace-nowrap text-text">
          <span className="text-[clamp(34px,11vw,42px)]">Teleo,</span>{" "}
          <span className="font-display italic text-[clamp(17px,5.2vw,20px)] tracking-normal text-text-secondary">a mi manera</span>
        </h1>
      </header>

      <div className="flex flex-col gap-5 stagger-children">
        {/* Leyendo ahora */}
        <Card tab={{ label: "Leyendo ahora", icon: BookOpen }}>

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
            <>
              <p className="text-body-md text-text-secondary">
                No tienes libros en progreso todavía.
              </p>
              <Button variant="soft" className="mt-3.5" onClick={() => setIsRandomPickOpen(true)}>
                <Shuffle size={16} />
                Elegir un pendiente al azar
              </Button>
            </>
          )}
          <div className="divide-y divide-dashed divide-border stagger-children">
            {books.map((book) => {
              const { percent, label } = getProgressInfo(book);
              const pace = getReadingPace(book);
              return (
                <div key={book.id} className="py-3.5 first:pt-0 last:pb-0">
                  <BookCardReading
                    title={book.title}
                    author={book.author ?? undefined}
                    coverUrl={book.cover_url ?? undefined}
                    progressPercent={percent}
                    progressLabel={label}
                    missingStartDate={!book.start_date}
                    paceText={pace ? paceSentence(pace) : null}
                    onUpdateClick={() => setUpdatingBookId(book.id)}
                  />
                </div>
              );
            })}
          </div>
        </Card>

        {/* Próximo lanzamiento: ocupa el lugar que dejó la lista de temporada */}
        <NextReleaseCard userId={user?.id} />

        {/* Racha diaria */}
        <Card
          tab={{ label: "Racha diaria de lectura", icon: Flag }}
          tone="orange"
          action={<CardAction onClick={() => setIsCalendarOpen(true)}>Calendario</CardAction>}
        >
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
                        ? "bg-orange border-orange text-on-orange"
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
        <Card tab={{ label: "Meta anual de lectura", icon: Target }} tone="pink">
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

      {isGoalModalOpen && (
        <EditGoalModal
          onClose={() => setIsGoalModalOpen(false)}
          currentGoal={goal}
          completedCount={completedCount}
          onSave={updateGoal}
        />
      )}

      {showAnnouncement && (
        <AnnouncementSheet
          onDone={handleAnnouncementDone}
          missed={missedVersions}
          lastSeen={seenAtEntry}
          onSeeAll={handleSeeAllNews}
        />
      )}
      {isCalendarOpen && <ReadingCalendarSheet userId={user?.id} onClose={() => setIsCalendarOpen(false)} />}
      {isRandomPickOpen && <RandomPickSheet userId={user?.id} onClose={() => setIsRandomPickOpen(false)} />}

      <UnmarkStreakModal
        isOpen={isUnmarkOpen}
        onConfirm={async () => {
          setIsUnmarkOpen(false)
          await unmarkToday()
        }}
        onDismiss={() => setIsUnmarkOpen(false)}
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