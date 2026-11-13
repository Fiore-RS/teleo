import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useCurrentlyReading } from "../hooks/useCurrentlyReading";
import { useReadingStreak } from "../hooks/useReadingStreak";
import { useAnnualGoal } from "../hooks/useAnnualGoal";
import { useProfile } from "../hooks/useProfile";
import { getProgressInfo } from "../lib/progress";
import { StreakRibbon } from "../assets/components/atoms/StreakRibbon";
import { CoverBand } from "../assets/components/atoms/CoverBand";
import { Skeleton, CoverSkeleton } from "../assets/components/atoms/Skeleton";
import { Card } from "../assets/components/molecules/Card";
import { BookCardReading } from "../assets/components/molecules/BookCardReading";
import { Button } from "../assets/components/atoms/Button";
import { TabBar, type TabKey } from "../assets/components/molecules/TabBar";
import { useEffect, useMemo, useState } from "react";
import { EditGoalModal } from "../assets/components/molecules/EditGoalModal";
import { UnmarkStreakModal } from "../assets/components/molecules/UnmarkStreakModal";
import { RandomPickSheet } from "../assets/components/molecules/RandomPickSheet";
import { ReadingCalendarSheet } from "../assets/components/molecules/ReadingCalendarSheet";
import { NextReleaseCard } from "../assets/components/molecules/NextReleaseCard";
import { AnnouncementSheet } from "../assets/components/molecules/AnnouncementSheet";
import { GoalPostcard } from "../assets/components/molecules/GoalPostcard";
import { goalCelebratedPatch, wasGoalCelebrated } from "../lib/goalCelebration";
import { useUiMarks } from "../hooks/useUiMarks";
import { MarkOwnedSheet } from "../assets/components/molecules/MarkOwnedSheet";
import { useUnownedPhysical } from "../hooks/useUnownedPhysical";
import { ownedOfferedPatch, wasOwnedOffered } from "../lib/owned";
import { DemoNotice } from "../assets/components/molecules/DemoNotice";
import { useTour } from "../context/tourContextValue";
import { ANNOUNCEMENT_OFFERS_TOUR, ANNOUNCEMENT_VERSION, isVersionBefore, missedAnnouncedVersions } from "../lib/announcement";
import { LATEST_VERSION, markChangelogSeen } from "../lib/changelog";
import { UpdateProgressModal } from '../assets/components/molecules/UpdateProgressModal'
import { getReadingPace, paceSentence } from '../lib/readingPace'
import { useStaggerOnce } from '../lib/motion'
import { queryClient } from '../lib/queryClient'
import { DetalleLibro } from './DetalleLibro'
import { GoalCard, StreakCard } from './mesa/MesaCards'
import { MesaAncha } from './mesa/MesaAncha'
import { useBreakpoint } from '../hooks/useBreakpoint'
import { RecapYearAnnouncement } from '../assets/components/recap/RecapYearAnnouncement'
import { RecapViewer } from '../assets/components/recap/RecapViewer'
import { isYearRecapAnnouncementDue, yearRecapSeenPatch } from '../lib/recapAnnouncement'
import { useYearReads } from '../hooks/useYearReads'
export function Mesa() {
  const staggerMesa = useStaggerOnce("mesa");
  const staggerLeyendo = useStaggerOnce("mesa-leyendo");
  const navigate = useNavigate();
  const { start: startTour } = useTour();
  const { user } = useAuth();
  const { books, isLoading: booksLoading, refetch: refetchBooks } = useCurrentlyReading(user?.id)
  const { streak, markedToday, markToday, unmarkToday, weekDays, isLoading: streakLoading } = useReadingStreak(user?.id);
  const { profile, updateProfile } = useProfile(user?.id)
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isUnmarkOpen, setIsUnmarkOpen] = useState(false);
  const { goal, completedCount, updateGoal, isLoading: goalLoading } = useAnnualGoal(user?.id);
  const [updatingBookId, setUpdatingBookId] = useState<string | null>(null)
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null)
  // Anuncio de diciembre de "Tu lectura en Teleo" (V.3.2.0) y el visor del año que abre.
  const [yearRecapDismissed, setYearRecapDismissed] = useState(false)
  const [isYearRecapOpen, setIsYearRecapOpen] = useState(false)
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
  // La cuenta de visitante (V.3.3.0) no ve anuncios de versión: quien la abre viene a probar.
  const [announcementDismissed, setAnnouncementDismissed] = useState(false)
  // Última versión que la persona había visto al entrar (V.2.1.2). Se fija una sola vez,
  // porque la versión guardada en el perfil se actualiza apenas entra.
  const [seenAtEntry, setSeenAtEntry] = useState<string | null | undefined>(undefined)
  if (profile && seenAtEntry === undefined) setSeenAtEntry(profile.last_seen_version ?? null)
  const showAnnouncement =
    !announcementDismissed && !!profile?.has_seen_intro && !profile.is_demo && seenAtEntry !== undefined && isVersionBefore(seenAtEntry, ANNOUNCEMENT_VERSION)
  const missedVersions = showAnnouncement ? missedAnnouncedVersions(seenAtEntry) : []

  // Se guarda la versión con la que entra, para saber exacto cuál fue la última que vio. Si
  // hay un anuncio pendiente, se guarda al cerrarlo (así no se pierde si cierra la app antes).
  const needsVersionUpdate =
    !!profile?.has_seen_intro && !showAnnouncement && !announcementDismissed && isVersionBefore(profile.last_seen_version, LATEST_VERSION)
  useEffect(() => {
    if (needsVersionUpdate) updateProfile({ last_seen_version: LATEST_VERSION })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsVersionUpdate])

  // Solo en diciembre, después del anuncio de versión (nunca los dos a la vez) y si hay libros
  // terminados en el año.
  // Lo que ya vio (resumen del año, postal, hoja de "Lo tengo") se recuerda en la cuenta desde
  // la V.3.7.2. Mientras no llega el perfil no se muestra ninguna de esas hojas.
  const { marks, ready: marksReady, patchMarks } = useUiMarks()
  const recapYear = new Date().getFullYear()
  const yearRecapDue = marksReady && isYearRecapAnnouncementDue(marks)
  const { reads: yearReads, isLoading: yearReadsLoading } = useYearReads(yearRecapDue ? user?.id : undefined, recapYear)
  const showYearRecap =
    yearRecapDue && !yearRecapDismissed && !!profile?.has_seen_intro && !showAnnouncement && !yearReadsLoading && yearReads.length > 0

  function closeYearRecapAnnouncement(open: boolean) {
    void patchMarks(yearRecapSeenPatch(recapYear))
    setYearRecapDismissed(true)
    if (open) setIsYearRecapOpen(true)
  }

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


  // Meta cumplida (V.3.6.0): la postal sale una vez por año (en la cuenta), también para
  // quien ya la había cumplido antes de esta versión. Nunca a la vez que el anuncio de versión
  // o el del resumen del año.
  const [goalCelebrationClosed, setGoalCelebrationClosed] = useState(false)
  const showGoalPostcard =
    !goalCelebrationClosed &&
    !goalLoading &&
    goal > 0 &&
    completedCount >= goal &&
    !!profile?.has_seen_intro &&
    !showAnnouncement &&
    !showYearRecap &&
    marksReady &&
    !wasGoalCelebrated(marks, recapYear)

  function closeGoalPostcard() {
    void patchMarks(goalCelebratedPatch(recapYear))
    setGoalCelebrationClosed(true)
  }

  // "Lo tengo" (V.3.7.0): una sola vez, ofrece marcar los libros físicos que ya estaban en la
  // biblioteca. Nunca a la vez que el anuncio de versión, el del resumen del año o la postal.
  const [ownedOfferClosed, setOwnedOfferClosed] = useState(false)
  const ownedOfferPending =
    !ownedOfferClosed && !!profile?.has_seen_intro && !profile.is_demo && marksReady && !wasOwnedOffered(marks)
  const { count: unownedCount, isLoading: unownedLoading } = useUnownedPhysical(user?.id, ownedOfferPending)
  const showOwnedOffer =
    ownedOfferPending && !showAnnouncement && !showYearRecap && !showGoalPostcard && !unownedLoading && unownedCount > 0

  function closeOwnedOffer() {
    void patchMarks(ownedOfferedPatch())
    setOwnedOfferClosed(true)
  }

  function handleTabChange(tab: TabKey) {
    navigate(`/${tab}`);
  }

  // Pantallas grandes (V.4.0.0): La mesa con su propio diseño (mesa/MesaAncha.tsx). El libro
  // abierto es el último que se actualizó; en el celular se sigue viendo la lista de siempre.
  const breakpoint = useBreakpoint();
  const isAncha = breakpoint !== "celular";
  const booksByProgress = useMemo(
    () => [...books].sort((a, b) => (b.progress_updated_at ?? "").localeCompare(a.progress_updated_at ?? "")),
    [books]
  );
  // Meta cumplida en pantallas grandes: la estampilla fija lleva el matasellos con el día en
  // que se cumplió (fecha de fin de la lectura número `goal` del año, como en Resumen › Año).
  const goalMet = isAncha && goal > 0 && completedCount >= goal;
  const { reads: goalYearReads } = useYearReads(goalMet ? user?.id : undefined, recapYear);
  const goalReachedText = goalMet && goalYearReads.length >= goal ? goalYearReads[goal - 1].endDate : null;
  const goalReachedOn = useMemo(
    () =>
      goalReachedText
        ? new Date(Number(goalReachedText.slice(0, 4)), Number(goalReachedText.slice(5, 7)) - 1, Number(goalReachedText.slice(8, 10)))
        : null,
    [goalReachedText]
  );

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";

  return (
    <div
      className={
        isAncha
          ? "relative min-h-screen bg-mesa px-8 escritorio:px-13 pt-10 pb-14"
          : "relative min-h-screen bg-glow-top px-4 pt-4"
      }
    >
      {isAncha ? (
        <MesaAncha
          layout={breakpoint === "escritorio" ? "escritorio" : "tableta"}
          greeting={profile?.nickname ? `${greeting}, ${profile.nickname}.` : `${greeting}.`}
          books={booksByProgress}
          booksLoading={booksLoading}
          streak={streak}
          markedToday={markedToday}
          streakLoading={streakLoading}
          dropKey={dropKey}
          staggerClass={staggerMesa}
          demoNotice={profile?.is_demo ? <div className="mb-6"><DemoNotice /></div> : null}
          releaseCard={<NextReleaseCard userId={user?.id} />}
          goalCard={
            <GoalCard
              goal={goal}
              completedCount={completedCount}
              isLoading={goalLoading}
              onEdit={() => setIsGoalModalOpen(true)}
              showStamp
              reachedOn={goalReachedOn}
            />
          }
          streakCard={
            <StreakCard
              streak={streak}
              markedToday={markedToday}
              weekDays={weekDays}
              isLoading={streakLoading}
              onCalendar={() => setIsCalendarOpen(true)}
              onMark={() => void markToday()}
              onUnmark={() => setIsUnmarkOpen(true)}
            />
          }
          onCalendar={() => setIsCalendarOpen(true)}
          onUpdate={setUpdatingBookId}
          onOpen={setSelectedBookId}
          onRandom={() => setIsRandomPickOpen(true)}
        />
      ) : (
      <>
      <CoverBand />
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

      <div className={`flex flex-col gap-5 ${staggerMesa}`}>
        {profile?.is_demo && <DemoNotice />}

        {/* Leyendo ahora */}
        <Card tab={{ label: "Leyendo ahora" }}>

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
                Elegir un pendiente al azar
              </Button>
            </>
          )}
          <div className={`divide-y divide-dashed divide-border ${staggerLeyendo}`}>
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
                    onOpen={() => setSelectedBookId(book.id)}
                  />
                </div>
              );
            })}
          </div>
        </Card>

        {/* Próximo lanzamiento: ocupa el lugar que dejó la lista de temporada */}
        <NextReleaseCard userId={user?.id} />

        {/* Racha diaria */}
        <StreakCard
          streak={streak}
          markedToday={markedToday}
          weekDays={weekDays}
          isLoading={streakLoading}
          onCalendar={() => setIsCalendarOpen(true)}
          onMark={() => void markToday()}
          onUnmark={() => setIsUnmarkOpen(true)}
        />

        {/* Meta anual */}
        <GoalCard goal={goal} completedCount={completedCount} isLoading={goalLoading} onEdit={() => setIsGoalModalOpen(true)} />
      </div>

      <div className="pb-28" />
      </>
      )}

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
          onStartTour={
            ANNOUNCEMENT_OFFERS_TOUR
              ? () => {
                  handleAnnouncementDone()
                  startTour()
                }
              : undefined
          }
          missed={missedVersions}
          lastSeen={seenAtEntry}
          onSeeAll={handleSeeAllNews}
        />
      )}
      {showYearRecap && (
        <RecapYearAnnouncement
          userId={user?.id}
          year={recapYear}
          onOpen={() => closeYearRecapAnnouncement(true)}
          onDismiss={() => closeYearRecapAnnouncement(false)}
        />
      )}
      {showGoalPostcard && (
        <GoalPostcard
          userId={user?.id}
          goal={goal}
          count={completedCount}
          year={recapYear}
          name={profile?.nickname || (profile?.username ? `@${profile.username}` : 'ti')}
          onClose={closeGoalPostcard}
        />
      )}
      {showOwnedOffer && <MarkOwnedSheet userId={user?.id} mode="offer" onClose={closeOwnedOffer} />}
      {isYearRecapOpen && (
        <RecapViewer userId={user?.id} period={{ kind: 'anio', year: recapYear }} onClose={() => setIsYearRecapOpen(false)} />
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

      {/* Detalles del libro: al cerrar se refresca todo, porque desde ahí se puede terminar
          el libro (cambia Leyendo ahora, la meta y la racha). */}
      {selectedBookId && (
        <DetalleLibro
          bookId={selectedBookId}
          onClose={() => { setSelectedBookId(null); void queryClient.invalidateQueries() }}
          onDeleted={() => { setSelectedBookId(null); void queryClient.invalidateQueries() }}
        />
      )}

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