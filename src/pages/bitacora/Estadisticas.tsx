import { useMemo, useState, type ReactNode } from 'react'
import {
  BookCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  Flag,
  Library,
  ScrollText,
  Star,
  TrendingUp,
  Users,
} from 'lucide-react'
import { useLibraryStats } from '../../hooks/useLibraryStats'
import { useGoalHistory } from '../../hooks/useGoalHistory'
import { useReadingStreak } from '../../hooks/useReadingStreak'
import { BreakdownList } from '../../assets/components/molecules/BreakdownList'
import { StatTile } from '../../assets/components/atoms/StatTile'
import { Skeleton } from '../../assets/components/atoms/Skeleton'
import { Card } from '../../assets/components/molecules/Card'
import { MoreRow } from '../../assets/components/molecules/MoreRow'
import { MonthCalendar } from '../../assets/components/atoms/MonthCalendar'
import { PeriodTransition } from '../../assets/components/atoms/PeriodTransition'
import { StreakTiles } from '../../assets/components/molecules/StreakTiles'
import { RatingRow } from '../../assets/components/molecules/RatingRow'
import { formatDuration } from '../../lib/progress'
import { MONTH_NAMES } from '../../lib/months'
import { categoryPlural } from '../../lib/options'

// "8.940" y no "8940": en español el separador de miles normalmente se omite con 4 cifras.
const numberFormat = new Intl.NumberFormat('es', { useGrouping: 'always' } as Intl.NumberFormatOptions)
const fmt = (n: number) => numberFormat.format(n)

const plural = (n: number, one: string, many: string) => `${fmt(n)} ${n === 1 ? one : many}`
const oneDecimal = (n: number) => n.toLocaleString('es', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

function Footnote({ children }: { children: ReactNode }) {
  return <p className="text-body-sm text-text-secondary text-center mt-4 text-balance">{children}</p>
}

/** Botón redondo de las flechas de mes y año. */
function NavButton({ label, onClick, disabled, children, className = '' }: {
  label: string
  onClick: () => void
  disabled?: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`rounded-full flex items-center justify-center disabled:opacity-35 focus-visible:outline-2 focus-visible:outline-primary-text ${className}`}
    >
      {children}
    </button>
  )
}

interface EstadisticasProps {
  userId: string | undefined
  /** Abre ese año en Resumen. */
  onOpenYear: (year: number) => void
}

type RowKey = 'ritmo' | 'coleccion' | 'autores' | 'calificaciones' | 'leido'

/** Bitácora > Estadísticas (V.3.0.0, "que no abrume"): arriba solo la tarjeta del año, con
 *  una frase y tres números, y flechas para ver años anteriores. Todo lo demás va en "Más de
 *  tu bitácora", plegado, una línea por tema; los temas sin datos no aparecen. Quien todavía
 *  no termina ningún libro ve, en lugar de la tarjeta del año, tres pasos para empezar. */
export function Estadisticas({ userId, onOpenYear }: EstadisticasProps) {
  const { stats, isLoading } = useLibraryStats(userId)
  const { history: goalHistory } = useGoalHistory(userId)
  const { streak: currentStreak } = useReadingStreak(userId)

  const currentYear = new Date().getFullYear()
  const today = new Date()
  const sessionDates = stats.ritmo.sessionDates
  const markedDates = useMemo(() => new Set(sessionDates), [sessionDates])
  const porAnio = stats.historialAnual.porAnio ?? []

  // Años que se pueden recorrer con las flechas: desde el primero con lecturas, metas o
  // sesiones hasta el actual.
  const firstYear = Math.min(
    currentYear,
    ...porAnio.map((y) => y.year),
    ...goalHistory.map((g) => g.year),
    ...sessionDates.map((d) => parseInt(d.slice(0, 4), 10)).filter((y) => !Number.isNaN(y))
  )
  const [year, setYear] = useState(currentYear)
  const [openRow, setOpenRow] = useState<RowKey | null>(null)

  // Ritmo: un solo mes grande; 0 = el mes actual. No se puede ir al futuro ni antes de la
  // primera sesión marcada.
  const [monthsBack, setMonthsBack] = useState(0)
  const firstSession = sessionDates.reduce<string | null>((min, d) => (!min || d < min ? d : min), null)
  const maxMonthsBack = firstSession
    ? (today.getFullYear() - parseInt(firstSession.slice(0, 4), 10)) * 12 + today.getMonth() - (parseInt(firstSession.slice(5, 7), 10) - 1)
    : 0
  const shownMonth = new Date(today.getFullYear(), today.getMonth() - monthsBack, 1)
  const shownMonthKey = `${shownMonth.getFullYear()}-${String(shownMonth.getMonth() + 1).padStart(2, '0')}`
  const daysReadInMonth = sessionDates.filter((d) => d.startsWith(shownMonthKey)).length

  function toggle(row: RowKey) {
    setOpenRow((current) => (current === row ? null : row))
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-5" aria-label="Cargando">
        <div className="bg-surface border border-border rounded-card shadow-card p-[18px]">
          <Skeleton className="h-5 w-4/5 rounded-full" />
          <Skeleton className="h-5 w-3/5 rounded-full mt-2" />
          <div className="grid grid-cols-3 gap-2 mt-4">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-14 rounded-[14px]" />)}
          </div>
        </div>
        <div className="bg-surface border border-border rounded-card shadow-card px-4 py-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 py-3">
              <Skeleton className="w-9 h-9 rounded-full shrink-0" />
              <div className="flex-1">
                <Skeleton className="h-3.5 w-2/5 rounded-full" />
                <Skeleton className="h-3 w-3/5 rounded-full mt-1.5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const hasFinished = stats.historialAnual.yearsBreakdown.length > 0
  const { resumen, coleccion, autoresYSeries, calificaciones } = stats

  // ---------- Tarjeta del año ----------
  const yearData = porAnio.find((y) => y.year === year)
  const finished = yearData?.finished ?? 0
  const goal = goalHistory.find((g) => g.year === year)?.goal
  const daysRead = sessionDates.filter((d) => d.startsWith(String(year))).length
  const isCurrent = year === currentYear
  const booksText = plural(finished, 'libro', 'libros')

  let sentence: ReactNode
  if (isCurrent) {
    sentence =
      finished === 0 ? (
        <>Todavía no terminas libros en {year}.{goal ? <> Tu meta es de <b className="font-semibold text-pink-text">{plural(goal, 'libro', 'libros')}</b>.</> : null}</>
      ) : (
        <>
          Llevas <b className="font-semibold text-magenta-text">{booksText}</b> en {year}
          {goal ? (
            finished >= goal ? <>, y ya cumpliste tu meta.</> : <>, a <b className="font-semibold text-pink-text">{goal - finished} de tu meta</b>.</>
          ) : '.'}
        </>
      )
  } else {
    sentence =
      finished === 0 ? (
        <>En {year} no terminaste libros.</>
      ) : (
        <>
          Terminaste <b className="font-semibold text-magenta-text">{booksText}</b> en {year}
          {goal ? (
            finished >= goal ? <>, y cumpliste tu meta de {goal}.</> : <>, de una meta de {goal}.</>
          ) : '.'}
        </>
      )
  }

  const trio: { value: string; label: string; color: string }[] = [
    { value: fmt(yearData?.pages ?? 0), label: 'páginas', color: 'text-pink-text' },
    { value: fmt(daysRead), label: daysRead === 1 ? 'día leído' : 'días leídos', color: 'text-orange-text' },
    { value: yearData?.avgRating != null ? oneDecimal(yearData.avgRating) : '—', label: 'promedio', color: 'text-magenta-text' },
  ]

  // ---------- Resúmenes de una línea ----------
  // Categoría en plural para las frases; si es "Libro", se habla del formato.
  const topCategory = categoryPlural(coleccion.byCategory[0]?.label)
  const topFormat = coleccion.byFormat[0]?.label?.toLowerCase()
  const readCategory = categoryPlural(coleccion.readByCategory[0]?.label)
  const readFormat = coleccion.readByFormat[0]?.label?.toLowerCase()
  const coleccionSummary = [
    plural(resumen.totalBooks, 'libro', 'libros'),
    topCategory ? `sobre todo ${topCategory}` : topFormat ? `la mayoría en ${topFormat}` : null,
  ]
    .filter(Boolean)
    .join(', ')
  const leidoSummary = readCategory
    ? `Sobre todo ${readCategory}${readFormat ? `, en ${readFormat}` : ''}`
    : readFormat
      ? `Sobre todo en ${readFormat}`
      : 'Por categoría y formato'
  const avgRatingRounded = calificaciones.avgRating != null ? Math.round(calificaciones.avgRating * 2) / 2 : null

  const showRitmo = sessionDates.length > 0
  const showColeccion = resumen.totalBooks > 0
  const showAutores = !!autoresYSeries.topAuthor || resumen.sagaCount > 0 || !!autoresYSeries.mostRereadBook
  const showCalificaciones = calificaciones.avgRating != null
  const showLeido = coleccion.readByCategory.length > 0 || coleccion.readByFormat.length > 0
  const hasRows = showRitmo || showColeccion || showAutores || showCalificaciones || showLeido

  const memberSinceLabel = resumen.memberSince
    ? new Intl.DateTimeFormat('es', { month: 'long', year: 'numeric' }).format(new Date(resumen.memberSince))
    : null

  const steps = [
    { label: 'Agregar tu primer libro', done: resumen.totalBooks > 0 },
    { label: 'Marcar tu primera sesión de lectura', done: sessionDates.length > 0 },
    { label: 'Terminar un libro', done: hasFinished },
  ]

  return (
    <div className="flex flex-col gap-5 stagger-children">
      {hasFinished ? (
        <Card
          tab={{ label: String(year), icon: TrendingUp }}
          tone="pink"
          action={
            <div className="flex items-center gap-1.5">
              <NavButton label="Año anterior" onClick={() => setYear((y) => y - 1)} disabled={year <= firstYear} className="w-[26px] h-[26px]">
                <ChevronLeft size={16} />
              </NavButton>
              <NavButton label="Año siguiente" onClick={() => setYear((y) => y + 1)} disabled={year >= currentYear} className="w-[26px] h-[26px]">
                <ChevronRight size={16} />
              </NavButton>
            </div>
          }
        >
          <PeriodTransition order={year}>
            <p className="font-display text-[20px] leading-[1.4] text-text">{sentence}</p>
            <div className="grid grid-cols-3 gap-2 mt-3.5">
              {trio.map((t) => (
                <div key={t.label} className="rounded-[14px] p-2.5 text-center" style={{ background: 'color-mix(in srgb, var(--color-surface-2) 70%, transparent)' }}>
                  <b className={`block font-display font-semibold text-[22px] leading-none tabular-nums ${t.color}`}>{t.value}</b>
                  <span className="text-[11.5px] text-text-secondary">{t.label}</span>
                </div>
              ))}
            </div>
          </PeriodTransition>
          <button
            type="button"
            onClick={() => onOpenYear(year)}
            className="mt-3.5 mx-auto flex items-center gap-0.5 font-body font-bold text-body-md text-pink-text rounded-full focus-visible:outline-2 focus-visible:outline-primary-text"
          >
            Ver tu {year} en Resumen
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </Card>
      ) : (
        <Card tab={{ label: 'Tu bitácora', icon: TrendingUp }}>
          <div className="text-center px-1.5 pt-2 pb-1">
            <div className="relative w-[92px] h-[92px] mx-auto mb-3" aria-hidden="true">
              <span className="absolute inset-0 rounded-full border-[1.5px] border-dashed border-ornament" />
              <span className="absolute inset-3.5 rounded-full bg-primary-soft text-primary-text flex items-center justify-center">
                <ScrollText size={30} />
              </span>
            </div>
            <h3 className="font-title text-[22px] leading-tight text-text">Aquí irá tu historia lectora</h3>
            <p className="text-[14.5px] leading-normal text-text-secondary mt-1.5">
              Cuando registres tus lecturas, esta pestaña se va llenando sola. Por ahora, tres pasos para empezar:
            </p>
            <ul className="mt-3.5 flex flex-col gap-2 text-left">
              {steps.map((s) => (
                <li
                  key={s.label}
                  className={`flex items-center gap-2.5 text-body-md bg-surface-2 rounded-xl px-3 py-2.5 ${s.done ? 'text-text-secondary line-through' : 'text-text'}`}
                >
                  <span
                    aria-hidden="true"
                    className={`w-[22px] h-[22px] shrink-0 rounded-full flex items-center justify-center ${
                      s.done ? 'bg-orange text-on-orange' : 'border-[1.5px] border-dashed border-ornament'
                    }`}
                  >
                    {s.done && <Check size={12} strokeWidth={3.5} />}
                  </span>
                  {s.label}
                  {s.done && <span className="sr-only"> (hecho)</span>}
                </li>
              ))}
            </ul>
          </div>
        </Card>
      )}

      {hasRows && (
        <Card tab={{ label: 'Más de tu bitácora', icon: Library }} padding="px-4 py-1">
          {/* Envoltorio propio: así "first:" apunta a la primera fila y no a la pestaña, y no
              queda una línea justo debajo de "Más de tu bitácora". */}
          <div>
          {showRitmo && (
            <MoreRow
              id="ritmo"
              tone="orange"
              icon={Flag}
              title="Ritmo y hábito"
              summary={
                stats.ritmo.longestStreak > 1
                  ? `Tu mejor racha fue de ${plural(stats.ritmo.longestStreak, 'día', 'días')}`
                  : plural(sessionDates.length, 'día leído', 'días leídos')
              }
              isOpen={openRow === 'ritmo'}
              onToggle={() => toggle('ritmo')}
            >
              <StreakTiles current={currentStreak} longest={stats.ritmo.longestStreak} />
              <div className="flex items-center justify-between mt-4 mb-2.5">
                <NavButton
                  label="Mes anterior"
                  onClick={() => setMonthsBack((m) => m + 1)}
                  disabled={monthsBack >= maxMonthsBack}
                  className="w-[30px] h-[30px] border border-border bg-surface-2 text-primary-text"
                >
                  <ChevronLeft size={16} />
                </NavButton>
                <div className="text-center">
                  <p className="font-title text-[18px] leading-none text-text">
                    {MONTH_NAMES[shownMonth.getMonth()]} {shownMonth.getFullYear()}
                  </p>
                  <p className="text-[12px] text-text-secondary mt-1">{plural(daysReadInMonth, 'día leído', 'días leídos')}</p>
                </div>
                <NavButton
                  label="Mes siguiente"
                  onClick={() => setMonthsBack((m) => Math.max(0, m - 1))}
                  disabled={monthsBack === 0}
                  className="w-[30px] h-[30px] border border-border bg-surface-2 text-primary-text"
                >
                  <ChevronRight size={16} />
                </NavButton>
              </div>
              <PeriodTransition order={-monthsBack}>
                <MonthCalendar
                  year={shownMonth.getFullYear()}
                  month={shownMonth.getMonth() + 1}
                  markedDates={markedDates}
                  size="lg"
                  showTitle={false}
                />
              </PeriodTransition>
              <div className="flex items-center justify-center gap-3.5 mt-2.5 text-[12px] text-text-secondary">
                <span className="inline-flex items-center gap-1.5">
                  <i className="w-2.5 h-2.5 rounded-[3px] bg-surface-2 border border-border" />
                  Sin marcar
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <i className="w-2.5 h-2.5 rounded-[3px] bg-orange" />
                  Leído
                </span>
              </div>
            </MoreRow>
          )}

          {showColeccion && (
            <MoreRow
              id="coleccion"
              tone="magenta"
              icon={Library}
              title="Tu colección"
              summary={coleccionSummary}
              isOpen={openRow === 'coleccion'}
              onToggle={() => toggle('coleccion')}
            >
              <div className="grid grid-cols-2 gap-2.5">
                <StatTile tone="pink" label="Páginas leídas" value={fmt(resumen.pagesRead)} />
                <StatTile tone="orange" label="Tiempo escuchado" value={formatDuration(resumen.audioSeconds)} />
                <StatTile tone="magenta" label="Libros terminados" value={String(resumen.finishedCount)} />
                <StatTile label="Libros en proceso" value={String(resumen.readingCount)} />
                <StatTile tone="pink" label="Libros deseados" value={String(resumen.wishlistCount)} />
                <StatTile tone="orange" label="Libros abandonados" value={String(resumen.abandonedCount)} />
                <StatTile tone="magenta" label="Sagas registradas" value={String(resumen.sagaCount)} />
                <StatTile label="Reseñas escritas" value={String(resumen.reviewCount)} />
              </div>
              <div className="space-y-5 mt-5">
                <BreakdownList title="Por categoría" entries={coleccion.byCategory} />
                <BreakdownList title="Por formato" entries={coleccion.byFormat} />
                <BreakdownList title="Por idioma" entries={coleccion.byLanguage} />
              </div>
              {(coleccion.longestBook || coleccion.shortestBook) && (
                <div className="grid grid-cols-2 gap-2.5 mt-5">
                  <StatTile
                    label="Libro más largo"
                    value={coleccion.longestBook ? `${coleccion.longestBook.title} (${coleccion.longestBook.value} pág.)` : '—'}
                  />
                  <StatTile
                    label="Libro más corto"
                    value={coleccion.shortestBook ? `${coleccion.shortestBook.title} (${coleccion.shortestBook.value} pág.)` : '—'}
                  />
                </div>
              )}
              {memberSinceLabel && <Footnote>Leyendo en Teleo desde {memberSinceLabel}</Footnote>}
            </MoreRow>
          )}

          {showAutores && (
            <MoreRow
              id="autores"
              tone="pink"
              icon={Users}
              title="Autores y sagas"
              summary={
                autoresYSeries.topAuthor
                  ? `Más libros de ${autoresYSeries.topAuthor.label}`
                  : plural(resumen.sagaCount, 'saga registrada', 'sagas registradas')
              }
              isOpen={openRow === 'autores'}
              onToggle={() => toggle('autores')}
            >
              <div className="grid grid-cols-2 gap-2.5">
                <StatTile
                  label="Quien más has leído"
                  value={autoresYSeries.topAuthor ? `${autoresYSeries.topAuthor.label} (${autoresYSeries.topAuthor.count})` : '—'}
                />
                <StatTile
                  label="Libro más releído"
                  value={autoresYSeries.mostRereadBook ? `${autoresYSeries.mostRereadBook.label} (${autoresYSeries.mostRereadBook.count}x)` : '—'}
                />
                <StatTile label="Sagas terminadas" value={String(autoresYSeries.sagasCompleted)} />
                <StatTile label="Sagas en proceso" value={String(autoresYSeries.sagasInProgress)} />
              </div>
            </MoreRow>
          )}

          {showCalificaciones && avgRatingRounded != null && (
            <MoreRow
              id="calificaciones"
              tone="orange"
              icon={Star}
              title="Calificaciones"
              summary={`Tu promedio: ${oneDecimal(avgRatingRounded)} estrellas`}
              isOpen={openRow === 'calificaciones'}
              onToggle={() => toggle('calificaciones')}
            >
              <div className="flex flex-col items-center gap-2 mb-5">
                <span className="font-display font-semibold text-[40px] leading-none text-text tabular-nums">{oneDecimal(avgRatingRounded)}</span>
                <RatingRow shape="star" color="var(--color-orange)" value={avgRatingRounded} size={20} />
                <p className="text-body-sm text-text-secondary text-center">Promedio entre todos los libros que calificaste</p>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <StatTile label="Mejor calificado" value={calificaciones.bestRated?.title ?? '—'} />
                <StatTile label="Peor calificado" value={calificaciones.worstRated?.title ?? '—'} />
                <StatTile label="Citas guardadas" value={String(calificaciones.quotesCount)} className="col-span-2" />
              </div>
              {calificaciones.hasTie && (
                <Footnote>
                  Si hay más de un libro con la misma calificación más alta o más baja, se mostrará uno al azar entre los empatados en cada visita a Bitácora.
                </Footnote>
              )}
            </MoreRow>
          )}

          {showLeido && (
            <MoreRow
              id="leido"
              tone="brand"
              icon={BookCheck}
              title="Lo que leíste"
              summary={leidoSummary}
              isOpen={openRow === 'leido'}
              onToggle={() => toggle('leido')}
            >
              <div className="space-y-5">
                <BreakdownList title="Por categoría" entries={coleccion.readByCategory} />
                <BreakdownList title="Por formato" entries={coleccion.readByFormat} />
              </div>
              <Footnote>Cuenta cada libro que terminaste, relecturas incluidas.</Footnote>
            </MoreRow>
          )}
          </div>
        </Card>
      )}
    </div>
  )
}
