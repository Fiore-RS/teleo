import { useMemo, useState, type ReactNode } from 'react'
import { GoalPostcard, GoalStamp, Postmark } from '../../assets/components/molecules/GoalPostcard'
import { useYearGoal } from '../../hooks/useYearGoal'
import { useProfile } from '../../hooks/useProfile'
import { Check } from 'lucide-react'
import { useYearReads, type YearRead } from '../../hooks/useYearReads'
import { usePeriodFavorites } from '../../hooks/usePeriodFavorites'
import { queryClient } from '../../lib/queryClient'
import { MONTH_ABBR, MONTH_NAMES } from '../../lib/months'
import { MiniCover } from '../../assets/components/atoms/MiniCover'
import { Sheet } from '../../assets/components/atoms/Sheet'
import { Button } from '../../assets/components/atoms/Button'
import { CoverSkeleton, Skeleton } from '../../assets/components/atoms/Skeleton'
import { Card } from '../../assets/components/molecules/Card'
import { MoreRow } from '../../assets/components/molecules/MoreRow'
import { Librero, Shelf, ShelfPlank } from '../../assets/components/molecules/Shelf'
import { Hoja } from '../../assets/components/molecules/Card'
import { useHojaMode } from '../../lib/hojaMode'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import { BookCover } from '../../assets/components/molecules/BookCover'
import { PeriodNav } from '../../assets/components/molecules/PeriodNav'
import { PeriodTransition } from '../../assets/components/atoms/PeriodTransition'
import { DetalleLibro } from '../DetalleLibro'
import { BreakdownList } from '../../assets/components/molecules/BreakdownList'
import { tally, formatLabel } from '../../lib/tally'
import { categoryPlural } from '../../lib/options'
import { useStaggerOnce } from '../../lib/motion'
import { TraitStatsRow } from '../../assets/components/molecules/TraitStatsRow'
import { CompleteShelfSheet } from '../../assets/components/molecules/CompleteShelfSheet'
import { computeTraitStats } from '../../lib/traitStats'
import type { RecapPeriod } from '../../lib/recap'
import { RecapEntryRow } from '../../assets/components/recap/RecapEntryRow'
import { RecapViewer } from '../../assets/components/recap/RecapViewer'

export type ResumenView = 'mes' | 'anio' | 'favoritos'

const views: { key: ResumenView; label: string }[] = [
  { key: 'mes', label: 'Mes' },
  { key: 'anio', label: 'Año' },
  { key: 'favoritos', label: 'Favoritos' },
]

const numberFormat = new Intl.NumberFormat('es', { useGrouping: 'always' } as Intl.NumberFormatOptions)
const fmt = (n: number) => numberFormat.format(n)

/** Hoja de Resumen (V.3.0.0): Mes, Año y Favoritos son pestañas de separador de una misma
 *  hoja con tinte rosa. La pestaña activa se une a la hoja; las otras quedan detrás, más
 *  bajas y en el fondo de la página. */
function ResumenSheet({ view, onViewChange, children }: {
  view: ResumenView
  onViewChange: (view: ResumenView) => void
  children: ReactNode
}) {
  // Modo hoja (V.4.2.0, tableta y computadora): la hoja del Cuaderno con Mes, Año y Favoritos
  // como un selector arriba, en vez de pestañas de separador.
  if (useHojaMode()) {
    return (
      <Hoja as="section">
        <div role="tablist" aria-label="Vista del resumen" className="flex p-[3px] rounded-[11px] bg-surface-2 mb-4">
          {views.map(({ key, label }) => {
            const isActive = view === key
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onViewChange(key)}
                className={`flex-1 h-[34px] rounded-[8px] font-body text-[15px] focus-visible:outline-2 focus-visible:outline-primary-text ${
                  isActive ? 'bg-surface text-primary-text font-bold shadow-[0_1px_2px_rgba(0,0,0,0.15)]' : 'text-text-secondary font-semibold hover:text-text'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
        {children}
      </Hoja>
    )
  }
  return (
    // El espacio de las pestañas va como padding de un contenedor y no como margen: un margen
    // se juntaba con el de la barra de arriba en Mes y la hoja quedaba pegada a ella.
    <div className="pt-[34px]">
    <section className="relative bg-pink-tint border border-border rounded-card rounded-tl-none shadow-card px-3.5 pt-4 pb-[18px]">
      <div role="tablist" aria-label="Vista del resumen" className="absolute -top-[34px] -left-px flex items-end">
        {views.map(({ key, label }) => {
          const isActive = view === key
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onViewChange(key)}
              className={`relative px-[18px] flex items-center border border-border border-b-0 rounded-t-[14px] font-body text-[15px] focus-visible:outline-2 focus-visible:outline-primary-text ${
                isActive
                  ? 'h-[34px] z-[1] bg-pink-tint text-pink-text font-bold'
                  : 'h-[29px] -ml-px first:ml-0 bg-surface-2 text-text-secondary font-semibold'
              }`}
            >
              {label}
              {isActive && <span aria-hidden="true" className="absolute -bottom-0.5 inset-x-0 h-[3px] bg-pink-tint" />}
            </button>
          )
        })}
      </div>
      {children}
    </section>
    </div>
  )
}

/** Un libro por id, aunque se haya terminado dos veces en el mismo periodo (relectura). */
function uniqueBooks(reads: YearRead[]) {
  const seen = new Map<string, YearRead>()
  for (const r of reads) if (!seen.has(r.bookId)) seen.set(r.bookId, r)
  return [...seen.values()]
}

interface ResumenProps {
  userId: string | undefined
  view: ResumenView
  onViewChange: (view: ResumenView) => void
  year: number
  onYearChange: (year: number) => void
}

/** Bitácora > Resumen (fase 6): los libros terminados por mes, el año completo y los
 *  favoritos de cada mes con el favorito del año. Todo sale de reading_history, así que una
 *  relectura aparece en el mes en que se volvió a terminar. */
export function Resumen({ userId, view, onViewChange, year, onYearChange }: ResumenProps) {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  const [month, setMonth] = useState(year === currentYear ? currentMonth : 12)
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null)
  // "Tu lectura en Teleo" (V.3.2.0): el periodo abierto en el visor.
  const [recapPeriod, setRecapPeriod] = useState<RecapPeriod | null>(null)

  const { reads, totalPages, totalAudioSeconds, isLoading } = useYearReads(userId, year)

  function goToMonth(y: number, m: number) {
    if (y !== year) onYearChange(y)
    setMonth(m)
  }

  function changeYear(y: number) {
    onYearChange(y)
    if (y === currentYear && month > currentMonth) setMonth(currentMonth)
  }

  return (
    <>
      {view === 'mes' && (
        <MonthView
          view={view}
          onViewChange={onViewChange}
          year={year}
          month={month}
          reads={reads.filter((r) => r.month === month)}
          isLoading={isLoading}
          canGoNext={year < currentYear || month < currentMonth}
          onPrev={() => (month === 1 ? goToMonth(year - 1, 12) : setMonth(month - 1))}
          onNext={() => (month === 12 ? goToMonth(year + 1, 1) : setMonth(month + 1))}
          onBookClick={setSelectedBookId}
          onOpenRecap={() => setRecapPeriod({ kind: 'mes', year, month })}
        />
      )}

      {view === 'anio' && (
        <YearView
          userId={userId}
          view={view}
          onViewChange={onViewChange}
          year={year}
          reads={reads}
          totalPages={totalPages}
          totalAudioSeconds={totalAudioSeconds}
          isLoading={isLoading}
          canGoNext={year < currentYear}
          onPrev={() => changeYear(year - 1)}
          onNext={() => changeYear(year + 1)}
          onMonthClick={(m) => {
            setMonth(m)
            onViewChange('mes')
          }}
          onBookClick={setSelectedBookId}
          onOpenRecap={() => setRecapPeriod({ kind: 'anio', year })}
        />
      )}

      {view === 'favoritos' && (
        <FavoritesView
          view={view}
          onViewChange={onViewChange}
          userId={userId}
          year={year}
          reads={reads}
          isLoading={isLoading}
          canGoNext={year < currentYear}
          onPrev={() => changeYear(year - 1)}
          onNext={() => changeYear(year + 1)}
        />
      )}

      {recapPeriod && <RecapViewer userId={userId} period={recapPeriod} onClose={() => setRecapPeriod(null)} />}

      {selectedBookId && (
        <DetalleLibro
          bookId={selectedBookId}
          onClose={() => {
            setSelectedBookId(null)
            queryClient.invalidateQueries({ queryKey: ['yearReads', userId] })
          }}
          onDeleted={() => {
            setSelectedBookId(null)
            queryClient.invalidateQueries()
          }}
        />
      )}
    </>
  )
}

/* ---------- Mes ---------- */

interface SheetViewProps {
  view: ResumenView
  onViewChange: (view: ResumenView) => void
}

interface MonthViewProps extends SheetViewProps {
  year: number
  month: number
  reads: YearRead[]
  isLoading: boolean
  canGoNext: boolean
  onPrev: () => void
  onNext: () => void
  onBookClick: (bookId: string) => void
  onOpenRecap: () => void
}

/** Mes: los libros terminados ese mes, en repisas. */
function MonthView({ view, onViewChange, year, month, reads, isLoading, canGoNext, onPrev, onNext, onBookClick, onOpenRecap }: MonthViewProps) {
  // La hoja entra con la misma animación que las tarjetas de Estadísticas y Compras (solo la
  // primera vez en la sesión).
  const stagger = useStaggerOnce('resumen-mes')
  const staggerLibros = useStaggerOnce('resumen-mes-libros')
  // En tableta y computadora el mes va a lo ancho, con más libros por repisa (V.4.2.0).
  const breakpoint = useBreakpoint()
  const hojaMode = useHojaMode()
  const perRow = breakpoint === 'escritorio' ? 6 : breakpoint === 'tableta' ? 5 : 3

  // Tableta y computadora (V.4.2.0, lienzo "Resumen · Mes"): a la izquierda la hoja del mes con
  // el número grande y Compartir; a la derecha "Lo que terminaste", con la fecha de cada libro.
  if (hojaMode) {
    const monthName = MONTH_NAMES[month - 1]
    return (
      <div className={`bitacora-hojas flex flex-col gap-5 ${stagger}`}>
        <ResumenSheet view={view} onViewChange={onViewChange}>
          <h2 className="sr-only">Libros terminados en {monthName} de {year}</h2>
          <PeriodNav
            label={`${monthName} ${year}`}
            onPrev={onPrev}
            onNext={onNext}
            canGoNext={canGoNext}
            prevLabel="Mes anterior"
            nextLabel="Mes siguiente"
          />
          <PeriodTransition order={year * 12 + month}>
            {isLoading ? (
              <Skeleton className="h-20 w-1/2 rounded-lg mt-5" />
            ) : (
              <>
                <p className="mt-5 font-title text-[80px] leading-[0.9] text-pink-text tabular-nums">{reads.length}</p>
                <p className="mt-1.5 font-display italic text-[19px] text-text-secondary">
                  {reads.length === 1 ? 'libro terminado' : 'libros terminados'} en {monthName.toLowerCase()}
                </p>
                {reads.length > 0 && (
                  <Button className="mt-5" onClick={onOpenRecap}>
                    Compartir mi mes
                  </Button>
                )}
              </>
            )}
          </PeriodTransition>
        </ResumenSheet>

        <Hoja title="Lo que terminaste">
          <PeriodTransition order={year * 12 + month}>
            {isLoading ? (
              <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${perRow}, minmax(0, 1fr))` }} aria-label="Cargando">
                {Array.from({ length: perRow }, (_, i) => <CoverSkeleton key={i} className="w-full" />)}
              </div>
            ) : reads.length === 0 ? (
              <p className="font-display italic text-[17px] text-text-secondary">No terminaste libros este mes.</p>
            ) : (
              <Shelf
                className={staggerLibros}
                perRow={perRow}
                items={reads.map((read) => ({
                  key: read.id,
                  title: read.title,
                  subtitle: `Terminado el ${Number(read.endDate.slice(8, 10))} de ${MONTH_NAMES[Number(read.endDate.slice(5, 7)) - 1].toLowerCase()}`,
                  onClick: () => onBookClick(read.bookId),
                  cover: <BookCover title={read.title} coverUrl={read.coverUrl ?? undefined} status="terminado" />,
                }))}
              />
            )}
          </PeriodTransition>
        </Hoja>
      </div>
    )
  }

  return (
    <div className={stagger}>
    <ResumenSheet view={view} onViewChange={onViewChange}>
      <h2 className="sr-only">Libros terminados en {MONTH_NAMES[month - 1]} de {year}</h2>
      <PeriodNav
        label={`${MONTH_NAMES[month - 1]} ${year}`}
        onPrev={onPrev}
        onNext={onNext}
        canGoNext={canGoNext}
        prevLabel="Mes anterior"
        nextLabel="Mes siguiente"
      />

      <PeriodTransition order={year * 12 + month}>
        {isLoading ? (
          <div className="grid grid-cols-3 gap-3 mt-4 px-2.5" aria-label="Cargando">
            {[0, 1, 2].map((i) => <CoverSkeleton key={i} className="w-full" />)}
          </div>
        ) : reads.length === 0 ? (
          <p className="text-body-md text-text-secondary text-center mt-4 mb-1">No terminaste libros este mes.</p>
        ) : (
          <>
            <p className="text-body-md text-text-secondary text-center mt-1 mb-3">
              {reads.length} {reads.length === 1 ? 'libro terminado' : 'libros terminados'}
            </p>
            <Shelf
              className={staggerLibros}
              perRow={perRow}
              items={reads.map((read) => ({
                key: read.id,
                title: read.title,
                onClick: () => onBookClick(read.bookId),
                cover: <BookCover title={read.title} coverUrl={read.coverUrl ?? undefined} status="terminado" />,
              }))}
            />
            {/* Compartir va al final: primero se ve el mes, después la invitación. */}
            <div className="mt-5">
              <RecapEntryRow label="Compartir mi mes" onClick={onOpenRecap} />
            </div>
          </>
        )}
      </PeriodTransition>
    </ResumenSheet>
    </div>
  )
}

/* ---------- Año ---------- */

interface YearViewProps extends SheetViewProps {
  userId: string | undefined
  year: number
  reads: YearRead[]
  totalPages: number
  totalAudioSeconds: number
  isLoading: boolean
  canGoNext: boolean
  onPrev: () => void
  onNext: () => void
  onMonthClick: (month: number) => void
  onBookClick: (bookId: string) => void
  onOpenRecap: () => void
}

/** Colores de los lomos, en el orden de los meses: los cuatro de la paleta del tema. */
const SPINE_TONES = [
  { bg: 'var(--color-primary)', ink: 'var(--color-primary-ink)' },
  { bg: 'var(--color-magenta)', ink: 'var(--color-on-magenta)' },
  { bg: 'var(--color-orange)', ink: 'var(--color-on-orange)' },
  { bg: 'var(--color-pink)', ink: 'var(--color-on-pink)' },
]

/** Año: una frase con lo esencial dentro de la hoja; debajo "Tu año en un estante" (un lomo
 *  por mes, más alto mientras más libros; tocarlo abre el mes) y "Más de tu año", plegado. */
function YearView({ userId, view, onViewChange, year, reads, totalPages, isLoading, canGoNext, onPrev, onNext, onMonthClick, onOpenRecap }: YearViewProps) {
  const stagger = useStaggerOnce('resumen-anio')
  const hojaMode = useHojaMode()
  const now = new Date()
  const { favorites } = usePeriodFavorites(userId, year)
  // Meta cumplida (V.3.6.0): la misma postal de La mesa, quieta, con el día en que se cumplió
  // (fecha de fin de la lectura número `goal`; las lecturas vienen ordenadas por fecha de fin).
  const { goal } = useYearGoal(userId, year)
  const { profile } = useProfile(userId)
  const goalReachedOnText = goal > 0 && reads.length >= goal ? reads[goal - 1].endDate : null
  const goalReachedOn = useMemo(
    () =>
      goalReachedOnText
        ? new Date(Number(goalReachedOnText.slice(0, 4)), Number(goalReachedOnText.slice(5, 7)) - 1, Number(goalReachedOnText.slice(8, 10)))
        : null,
    [goalReachedOnText]
  )
  const [isPostcardOpen, setIsPostcardOpen] = useState(false)
  const [openRow, setOpenRow] = useState<'leido' | 'rasgos' | 'favoritos' | null>(null)
  const [isCompleteShelfOpen, setIsCompleteShelfOpen] = useState(false)
  // Géneros y ánimos del año (V.3.1.0): cada libro una vez, aunque se haya releído.
  const traitStats = useMemo(() => computeTraitStats(reads.map((r) => ({ ...r, id: r.bookId }))), [reads])
  const counts = useMemo(() => {
    const c = Array.from({ length: 12 }, () => 0)
    for (const r of reads) c[r.month - 1] += 1
    return c
  }, [reads])
  const byCategory = useMemo(() => tally(reads.map((r) => r.category)), [reads])
  const byFormat = useMemo(() => tally(reads.map((r) => formatLabel(r.format))), [reads])

  const isCurrentYear = year === now.getFullYear()
  const lastMonth = isCurrentYear ? now.getMonth() + 1 : 12
  const max = Math.max(...counts)
  const bestMonths = counts.filter((c) => c === max).length
  const bestMonth = max >= 2 && bestMonths === 1 ? counts.indexOf(max) : -1
  // Alto del lomo: 30px de base y hasta 120px más, repartidos según el mes con más libros.
  const unit = max > 0 ? Math.min(22, 120 / max) : 0

  const monthsWithReads = counts.slice(0, lastMonth).filter((c) => c > 0).length
  const monthsPicked = favorites.filter((f) => f.month !== null && f.bookId).length
  const topCategory = categoryPlural(byCategory[0]?.label)
  const topFormat = byFormat[0]?.label?.toLowerCase()
  const leidoSummary = topCategory
    ? `Sobre todo ${topCategory}${topFormat ? `, en ${topFormat}` : ''}`
    : topFormat
      ? `Sobre todo en ${topFormat}`
      : 'Por categoría y formato'

  const n = reads.length
  const sentence =
    n === 0 ? (
      isCurrentYear ? <>Todavía no terminas libros en {year}.</> : <>En {year} no terminaste libros.</>
    ) : (
      <>
        {isCurrentYear ? 'Llevas' : 'Terminaste'}{' '}
        <b className="font-semibold text-magenta-text">{n} {n === 1 ? 'libro' : 'libros'}</b>
        {totalPages > 0 && <>, unas <b className="font-semibold text-pink-text">{fmt(totalPages)} páginas</b></>}
        {isCurrentYear ? ` en ${year}` : ''}.
        {bestMonth >= 0 && <> {MONTH_NAMES[bestMonth]} fue tu mejor mes.</>}
      </>
    )

  return (
    <div className={`bitacora-hojas flex flex-col gap-5 ${stagger}`}>
      <ResumenSheet view={view} onViewChange={onViewChange}>
        <h2 className="sr-only">Tu {year} en libros</h2>
        <PeriodNav
          label={String(year)}
          onPrev={onPrev}
          onNext={onNext}
          canGoNext={canGoNext}
          prevLabel="Año anterior"
          nextLabel="Año siguiente"
        />
        <PeriodTransition order={year}>
          {isLoading ? (
            <div className="mt-4" aria-label="Cargando">
              <Skeleton className="h-5 w-4/5 rounded-full" />
              <Skeleton className="h-5 w-3/5 rounded-full mt-2" />
            </div>
          ) : (
            <>
              {/* V.3.6.0, opción E: con la meta cumplida, la estampilla se pega junto a la frase,
                  como un sello en la página, y al tocarla se abre la postal completa. */}
              {hojaMode && (
                <>
                  <p className="mt-5 font-title text-[80px] leading-[0.9] text-pink-text tabular-nums">{n}</p>
                  <p className="mt-1.5 font-display italic text-[19px] text-text-secondary">
                    {n === 1 ? 'libro terminado' : 'libros terminados'} en {year}
                  </p>
                </>
              )}
              <div className="flex items-start gap-3 mt-3">
                <div className="flex-1 min-w-0">
                  <p className={`font-display text-text ${hojaMode ? 'text-[18px] leading-[32px] mt-2' : 'text-[20px] leading-[1.4]'}`}>{sentence}</p>
                  {goalReachedOn && (
                    <p className="text-body-sm font-bold text-primary-text mt-2">
                      Meta de {goal} cumplida el {goalReachedOn.getDate()} de {MONTH_NAMES[goalReachedOn.getMonth()].toLowerCase()}
                    </p>
                  )}
                </div>
                {goalReachedOn && (
                  <button
                    type="button"
                    onClick={() => setIsPostcardOpen(true)}
                    aria-label="Ver la postal de tu meta cumplida"
                    className="postcard-static relative shrink-0 w-[72px] h-[90px] mr-1 mt-1 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-text"
                  >
                    <span className="absolute left-0 top-0 origin-top-left scale-75">
                      <GoalStamp goal={goal} />
                    </span>
                    <Postmark date={goalReachedOn} className="absolute -left-6 -bottom-3 w-[84px] h-[45px]" />
                  </button>
                )}
              </div>
              {n > 0 &&
                (hojaMode ? (
                  <Button className="mt-5" onClick={onOpenRecap}>
                    Compartir mi año
                  </Button>
                ) : (
                  <div className="mt-5">
                    <RecapEntryRow label="Compartir mi año" onClick={onOpenRecap} />
                  </div>
                ))}
            </>
          )}
        </PeriodTransition>
      </ResumenSheet>

      {isPostcardOpen && goalReachedOn && (
        <GoalPostcard
          userId={userId}
          goal={goal}
          count={reads.length}
          year={year}
          name={profile?.nickname || (profile?.username ? `@${profile.username}` : 'ti')}
          reachedOn={goalReachedOn}
          ongoing={isCurrentYear}
          onClose={() => setIsPostcardOpen(false)}
        />
      )}

      {hojaMode ? (
        // Tableta y computadora (V.4.2.0): el librero del Estante, un compartimento por mes con
        // sus lomos parados. Tocar un mes lo abre.
        <Hoja title="Tu año en un estante">
          <PeriodTransition order={year}>
            <Librero>
              <div className="grid grid-cols-6 gap-x-2 gap-y-1 px-2.5 pt-4">
                {counts.map((c, i) => {
                  const month = i + 1
                  const isFuture = month > lastMonth
                  const label = `${MONTH_NAMES[i]}: ${isFuture ? 'todavía no llega' : c === 0 ? 'sin libros' : `${c} ${c === 1 ? 'libro' : 'libros'}`}`
                  return (
                    <button
                      key={month}
                      type="button"
                      disabled={isFuture}
                      onClick={() => onMonthClick(month)}
                      aria-label={label}
                      className={`group rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FBF3EA] ${isFuture ? 'opacity-35' : ''}`}
                    >
                      <span className="flex items-end justify-center gap-[3px] h-[78px] px-1 transition-transform duration-200 group-hover:-translate-y-0.5 motion-reduce:transition-none">
                        {Array.from({ length: Math.min(c, 9) }, (_, j) => {
                          const tone = SPINE_TONES[(i + j) % SPINE_TONES.length]
                          return (
                            <span
                              key={j}
                              aria-hidden="true"
                              className="w-[9px] rounded-t-[2px] shadow-[inset_-2px_0_0_rgba(0,0,0,0.18)]"
                              style={{ height: 56 + ((i * 7 + j * 11) % 18), background: tone.bg }}
                            />
                          )
                        })}
                      </span>
                      <ShelfPlank className="h-2! -mx-1.5" />
                      <span className="block text-center text-[12px] font-bold text-[#FBF3EA] mt-1 mb-2 capitalize">
                        {MONTH_ABBR[i]}
                        {c > 0 && <span className="font-semibold opacity-75"> · {c}</span>}
                      </span>
                    </button>
                  )
                })}
              </div>
            </Librero>
          </PeriodTransition>
          <p className="text-[12.5px] text-text-muted text-center mt-2.5">Toca un mes para ver sus libros.</p>
        </Hoja>
      ) : (
      <Card tab={{ label: 'Tu año en un estante' }}>
        <PeriodTransition order={year}>
          <div className="flex items-end gap-1 h-[150px] px-0.5">
            {counts.map((c, i) => {
              const month = i + 1
              const isFuture = month > lastMonth
              const tone = SPINE_TONES[i % SPINE_TONES.length]
              const label = `${MONTH_NAMES[i]}: ${isFuture ? 'todavía no llega' : c === 0 ? 'sin libros' : `${c} ${c === 1 ? 'libro' : 'libros'}`}`
              return c === 0 ? (
                <button
                  key={month}
                  type="button"
                  disabled={isFuture}
                  onClick={() => onMonthClick(month)}
                  aria-label={label}
                  className={`flex-1 h-[26px] rounded-t-[5px] rounded-b-[2px] border-[1.5px] border-dashed border-border flex items-end justify-center pb-1 text-[10px] font-bold text-text-muted uppercase focus-visible:outline-2 focus-visible:outline-primary-text ${
                    isFuture ? 'opacity-30' : ''
                  }`}
                >
                  {MONTH_ABBR[i][0]}
                </button>
              ) : (
                <button
                  key={month}
                  type="button"
                  onClick={() => onMonthClick(month)}
                  aria-label={label}
                  className="flex-1 rounded-t-[5px] rounded-b-[2px] flex flex-col items-center justify-between pt-[5px] pb-1 shadow-[inset_-3px_0_0_rgba(0,0,0,0.15)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary-text"
                  style={{
                    height: 30 + c * unit,
                    color: tone.ink,
                    background: `linear-gradient(160deg, ${tone.bg}, color-mix(in srgb, ${tone.bg} 72%, #000))`,
                  }}
                >
                  <b className="font-display font-semibold text-[13px] leading-none tabular-nums">{c}</b>
                  <span className="text-[10px] font-bold opacity-90 uppercase">{MONTH_ABBR[i][0]}</span>
                </button>
              )
            })}
          </div>
        </PeriodTransition>
        <ShelfPlank />
        <p className="text-[12.5px] text-text-muted text-center mt-2.5">Toca un mes para ver sus libros.</p>
      </Card>
      )}

      {!isLoading && n > 0 && (
        <Card group tab={{ label: `Más de tu ${year}` }} padding="px-4 py-1">
          <div>
            {(byCategory.length > 0 || byFormat.length > 0) && (
              <MoreRow
                id="anio-leido"
                title="Qué leíste"
                summary={leidoSummary}
                isOpen={openRow === 'leido'}
                onToggle={() => setOpenRow((r) => (r === 'leido' ? null : 'leido'))}
              >
                <div className="space-y-5">
                  <BreakdownList title="Por categoría" entries={byCategory} />
                  <BreakdownList title="Por formato" entries={byFormat} />
                </div>
              </MoreRow>
            )}
            <TraitStatsRow
              id="anio-rasgos"
              stats={traitStats}
              isOpen={openRow === 'rasgos'}
              onToggle={() => setOpenRow((r) => (r === 'rasgos' ? null : 'rasgos'))}
              onCompleteShelf={() => setIsCompleteShelfOpen(true)}
            />
            <MoreRow
              id="anio-favoritos"
              title="Tus favoritos"
              summary={
                monthsWithReads === 0
                  ? 'Elige el favorito de cada mes'
                  : `Ya elegiste ${monthsPicked} de ${monthsWithReads} ${monthsWithReads === 1 ? 'mes' : 'meses'}`
              }
              isOpen={openRow === 'favoritos'}
              onToggle={() => setOpenRow((r) => (r === 'favoritos' ? null : 'favoritos'))}
            >
              <p className="text-body-md text-text-secondary">
                Elige tu libro favorito de cada mes y, entre ellos, el favorito del año.
              </p>
              <Button variant="soft" className="mt-3" onClick={() => onViewChange('favoritos')}>
                Ir a favoritos
              </Button>
            </MoreRow>
          </div>
        </Card>
      )}
      {isCompleteShelfOpen && <CompleteShelfSheet userId={userId} onClose={() => setIsCompleteShelfOpen(false)} />}
    </div>
  )
}

/* ---------- Favoritos ---------- */

interface FavoritesViewProps extends SheetViewProps {
  userId: string | undefined
  year: number
  reads: YearRead[]
  isLoading: boolean
  canGoNext: boolean
  onPrev: () => void
  onNext: () => void
}

function FavoritesView({ view, onViewChange, userId, year, reads, isLoading, canGoNext, onPrev, onNext }: FavoritesViewProps) {
  const stagger = useStaggerOnce('resumen-favoritos')
  const hojaMode = useHojaMode()
  const { favorites, setFavorite } = usePeriodFavorites(userId, year)
  // Qué se está eligiendo: un mes (1-12) o el año (0).
  const [picking, setPicking] = useState<number | null>(null)

  const now = new Date()
  const lastMonth = year === now.getFullYear() ? now.getMonth() + 1 : 12
  const bookById = useMemo(() => new Map(reads.map((r) => [r.bookId, r])), [reads])
  const favoriteFor = (month: number | null) => favorites.find((f) => f.month === month)

  // El favorito del año se elige entre los favoritos de cada mes.
  const monthlyFavoriteBooks = uniqueBooks(
    favorites
      .filter((f) => f.month !== null && f.bookId)
      .sort((a, b) => (a.month ?? 0) - (b.month ?? 0))
      .map((f) => bookById.get(f.bookId!))
      .filter((r): r is YearRead => Boolean(r))
  )
  const yearFavorite = favoriteFor(null)
  const yearFavoriteBook = yearFavorite?.bookId ? bookById.get(yearFavorite.bookId) : undefined

  const pickerOptions =
    picking === 0 ? monthlyFavoriteBooks : picking ? uniqueBooks(reads.filter((r) => r.month === picking)) : []
  const pickerCurrent = picking === null ? undefined : favoriteFor(picking === 0 ? null : picking)

  return (
    <div className={`bitacora-hojas flex flex-col gap-5 ${stagger}`}>
      <ResumenSheet view={view} onViewChange={onViewChange}>
        <h2 className="sr-only">Favoritos de {year}</h2>
        <PeriodNav
          label={String(year)}
          onPrev={onPrev}
          onNext={onNext}
          canGoNext={canGoNext}
          prevLabel="Año anterior"
          nextLabel="Año siguiente"
        />
        <PeriodTransition order={year}>
          <div className="mt-3.5">
            {isLoading ? (
              <div className="flex gap-3.5 items-center" aria-label="Cargando">
                <CoverSkeleton className="w-[84px] shrink-0" />
                <div className="flex-1">
                  <Skeleton className="h-3 w-1/3 rounded-full" />
                  <Skeleton className="h-5 w-4/5 rounded-full mt-2" />
                </div>
              </div>
            ) : yearFavoriteBook ? (
              <button
                type="button"
                onClick={() => setPicking(0)}
                className={`w-full flex text-left rounded-xl focus-visible:outline-2 focus-visible:outline-primary-text ${
                  hojaMode ? 'flex-col items-start gap-4' : 'items-center gap-3.5'
                }`}
              >
                <MiniCover
                  src={yearFavoriteBook.coverUrl}
                  title={yearFavoriteBook.title}
                  className={`${hojaMode ? 'w-[150px]' : 'w-[84px]'} shrink-0 rounded-lg! shadow-[0_10px_18px_-10px_rgba(0,0,0,0.6)]`}
                />
                <span className="min-w-0">
                  <span className="seal mb-2 text-magenta-text">Favorito del año</span>
                  <span className="block font-display font-semibold text-[20px] leading-[1.2] text-text">{yearFavoriteBook.title}</span>
                  {yearFavoriteBook.author && <span className="block text-body-md text-text-secondary mt-0.5">{yearFavoriteBook.author}</span>}
                  <span className="block text-[13px] font-bold text-magenta-text mt-2.5">Cambiar</span>
                </span>
              </button>
            ) : monthlyFavoriteBooks.length === 0 ? (
              <p className="text-body-md text-text-secondary text-center">
                Elige el favorito de cada mes y después, entre ellos, el del año.
              </p>
            ) : (
              <>
                <p className="text-body-md text-text-secondary text-center">
                  {yearFavorite ? 'Dejaste vacío el favorito del año.' : `Elige el favorito del año entre tus ${monthlyFavoriteBooks.length} favoritos de cada mes.`}
                </p>
                <Button variant="magenta" className="mt-3" onClick={() => setPicking(0)}>
                  Elegir favorito del año
                </Button>
              </>
            )}
          </div>
        </PeriodTransition>
      </ResumenSheet>

      <Card tab={{ label: 'Uno por mes' }}>
        <PeriodTransition order={year}>
          {isLoading ? (
            <div className={`grid gap-x-2 gap-y-3 ${hojaMode ? 'grid-cols-6 gap-x-4 gap-y-5' : 'grid-cols-4'}`} aria-label="Cargando">
              {Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="aspect-2/3 rounded-md" />)}
            </div>
          ) : (
            <div className={`grid gap-x-2 gap-y-3 ${hojaMode ? 'grid-cols-6 gap-x-4 gap-y-5' : 'grid-cols-4'}`}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
                const isFuture = month > lastMonth
                const monthReads = reads.filter((r) => r.month === month)
                const fav = favoriteFor(month)
                const book = fav?.bookId ? bookById.get(fav.bookId) : undefined
                const canPick = !isFuture && monthReads.length > 0
                return (
                  <button
                    key={month}
                    type="button"
                    onClick={() => setPicking(month)}
                    disabled={!canPick}
                    aria-label={`${MONTH_NAMES[month - 1]}: ${book ? book.title : !canPick ? 'sin libros terminados' : fav ? 'vacío' : 'elegir favorito'}`}
                    className={`text-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-text ${isFuture ? 'opacity-35' : ''}`}
                  >
                    {book ? (
                      <MiniCover src={book.coverUrl} title={book.title} className="w-full rounded-md! shadow-[0_5px_10px_-6px_rgba(0,0,0,0.6)]" />
                    ) : (
                      <span
                        className={`w-full aspect-2/3 rounded-md border-[1.5px] border-dashed flex items-center justify-center px-1 text-[10.5px] leading-tight ${
                          canPick && !fav ? 'border-ornament text-primary-text font-bold' : 'border-border text-text-muted font-semibold'
                        }`}
                      >
                        {isFuture ? '' : !canPick ? 'Sin libros' : fav ? 'Vacío' : 'Elegir'}
                      </span>
                    )}
                    <span className="block text-[11px] font-bold text-text-secondary mt-1 capitalize">{MONTH_ABBR[month - 1]}</span>
                  </button>
                )
              })}
            </div>
          )}
        </PeriodTransition>
      </Card>

      {picking !== null && (
        <Sheet
          title={picking === 0 ? `Favorito del ${year}` : `Favorito de ${MONTH_NAMES[picking - 1].toLowerCase()}`}
          onClose={() => setPicking(null)}
        >
          <ul className="flex flex-col gap-1">
            {pickerOptions.map((book) => {
              const isSelected = pickerCurrent?.bookId === book.bookId
              return (
                <li key={book.bookId}>
                  <button
                    type="button"
                    onClick={() => {
                      setFavorite(picking === 0 ? null : picking, book.bookId)
                      setPicking(null)
                    }}
                    aria-pressed={isSelected}
                    className={`w-full flex items-center gap-3 p-2 rounded-2xl text-left border transition-colors ${
                      isSelected ? 'bg-magenta-soft border-magenta' : 'border-transparent active:bg-surface-2'
                    }`}
                  >
                    <MiniCover src={book.coverUrl} title={book.title} className="w-11" />
                    <span className="flex-1 min-w-0">
                      <span className="block font-display font-semibold text-body-md text-text truncate">{book.title}</span>
                      {book.author && <span className="block text-body-sm text-text-secondary truncate">{book.author}</span>}
                    </span>
                    {isSelected && <Check size={18} className="text-magenta-text shrink-0" />}
                  </button>
                </li>
              )
            })}
          </ul>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              setFavorite(picking === 0 ? null : picking, null)
              setPicking(null)
            }}
          >
            Dejar vacío
          </Button>
        </Sheet>
      )}
    </div>
  )
}
