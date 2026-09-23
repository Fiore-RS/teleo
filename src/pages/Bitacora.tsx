import { useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, ChevronLeft, ChevronRight, Flame, Trophy, LayoutGrid, Library, Users, Star, CalendarDays, Coins } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { useLibraryStats, type CountEntry } from '../hooks/useLibraryStats'
import { useGoalHistory } from '../hooks/useGoalHistory'
import { useReadingStreak } from '../hooks/useReadingStreak'
import { StatTile } from '../assets/components/atoms/StatTile'
import { Skeleton, StatTileSkeleton } from '../assets/components/atoms/Skeleton'
import { Eyebrow } from '../assets/components/atoms/Eyebrow'
import { Card } from '../assets/components/molecules/Card'
import { ProgressBar } from '../assets/components/atoms/ProgressBar'
import { BarChart } from '../assets/components/atoms/BarChart'
import { MonthCalendar } from '../assets/components/atoms/MonthCalendar'
import { RatingRow } from '../assets/components/molecules/RatingRow'
import { YearBooksModal } from '../assets/components/molecules/YearBooksModal'
import { TabBar, type TabKey } from '../assets/components/molecules/TabBar'
import { formatCurrency } from '../lib/currencies'
import { formatDuration } from '../lib/progress'

const MONTH_ABBR = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

// Rediseño 2026: cada grupo es una tarjeta con su etiqueta en mayúsculas (Eyebrow), igual
// que La mesa, y los datos van en recuadros (StatTile) con la cifra arriba y la etiqueta abajo.
function SubLabel({ children }: { children: string }) {
  return <p className="font-body font-semibold text-body-md text-text mb-2.5">{children}</p>
}

function Footnote({ children }: { children: ReactNode }) {
  return <p className="text-body-sm text-text-secondary text-center mt-4 text-balance">{children}</p>
}

function BreakdownList({ title, entries }: { title: string; entries: CountEntry[] }) {
  if (entries.length === 0) return null
  const total = entries.reduce((sum, e) => sum + e.count, 0)
  return (
    <div>
      <SubLabel>{title}</SubLabel>
      <div className="space-y-2.5">
        {entries.map((e) => (
          <div key={e.label}>
            <div className="flex items-center justify-between text-body-sm text-text mb-1">
              <span className="truncate">{e.label}</span>
              <span className="text-text-secondary shrink-0 ml-2 tabular-nums">{e.count}</span>
            </div>
            <ProgressBar percent={total > 0 ? (e.count / total) * 100 : 0} />
          </div>
        ))}
      </div>
    </div>
  )
}

export function Bitacora() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { profile } = useProfile(user?.id)
  const { stats, isLoading: statsLoading } = useLibraryStats(user?.id)
  const { history: goalHistory } = useGoalHistory(user?.id)
  // Racha actual: mismo hook que ya usa Mesa para el widget de "hoy" (maneja el caso de
  // que aún no se marque hoy pero ayer sí, etc.) — acá solo se lee el número, sin las
  // acciones de marcar/desmarcar, que siguen viviendo en Mesa.
  const { streak: currentStreak } = useReadingStreak(user?.id)

  const [selectedYear, setSelectedYear] = useState<number | null>(null)

  // Calendario de "Ritmo y hábito": se muestran 2 meses a la vez (más fácil de leer que
  // intentar meter casi un año en una tira de semanas) y se navega de 2 en 2 meses hacia
  // atrás con las flechas — 0 = mes actual + el anterior, no se puede navegar al futuro.
  const [monthsBack, setMonthsBack] = useState(0)
  const markedDates = useMemo(() => new Set(stats.ritmo.sessionDates), [stats.ritmo.sessionDates])

  const newerMonthDate = new Date()
  newerMonthDate.setDate(1)
  newerMonthDate.setMonth(newerMonthDate.getMonth() - monthsBack)
  const olderMonthDate = new Date(newerMonthDate)
  olderMonthDate.setMonth(olderMonthDate.getMonth() - 1)
  const newerMonth = { year: newerMonthDate.getFullYear(), month: newerMonthDate.getMonth() + 1 }
  const olderMonth = { year: olderMonthDate.getFullYear(), month: olderMonthDate.getMonth() + 1 }

  function handleTabBarChange(t: TabKey) {
    navigate(`/${t}`)
  }

  const currentYear = new Date().getFullYear()
  const memberSinceLabel = stats.resumen.memberSince
    ? new Intl.DateTimeFormat('es', { month: 'long', year: 'numeric' }).format(new Date(stats.resumen.memberSince))
    : null

  // "Mis años en libros": mismo cruce entre yearsBreakdown y metas por año que antes vivía
  // en ProfileView — se muda tal cual a Bitácora, dentro de "Historial anual".
  const goalByYear = new Map(goalHistory.map((g) => [g.year, g]))
  const yearsInBooks = [
    ...new Set([...stats.historialAnual.yearsBreakdown.map((y) => y.year), ...goalHistory.map((g) => g.year)]),
  ]
    .sort((a, b) => b - a)
    .map((year) => {
      const goalEntry = goalByYear.get(year)
      const count = stats.historialAnual.yearsBreakdown.find((y) => y.year === year)?.count ?? goalEntry?.completedCount ?? 0
      return { year, count, goal: goalEntry?.goal }
    })

  const currency = profile?.currency

  // Calificación promedio: redondeada al medio punto más cercano para las estrellas — el
  // promedio real (ej. 4.3) casi nunca cae justo en un múltiplo de 0.5, y sin este
  // redondeo la comparación "value >= position - 0.5" de RatingRow terminaba mostrando
  // menos estrellas de las que el número en texto sugería (4.3 se veía como 4.0 en vez de
  // la media estrella más cercana). Se usa el mismo valor redondeado tanto en las
  // estrellas como en el texto para que ambos siempre coincidan.
  const avgRatingRounded = stats.calificaciones.avgRating != null ? Math.round(stats.calificaciones.avgRating * 2) / 2 : null

  // 2026-08-30 (feedback de Fiorella): no se bloquea el render con un estado de carga
  // en blanco (como pasaba antes) — igual que Estante/Cuaderno, la página se pinta de una
  // vez con los valores por defecto de `emptyStats` (todo en 0/vacío) y se actualiza sola
  // cuando llegan los datos reales, sin el parpadeo de pantalla en blanco.
  return (
    <div className="min-h-screen bg-glow-top px-4 pt-4">
      <header className="px-1 pt-4 pb-5">
        <h1 className="font-title text-[clamp(30px,8.5vw,44px)] leading-none text-text">Bitácora</h1>
        <p className="font-body text-body-md text-text-secondary mt-2">
          Tu viaje literario: tu ritmo, tu colección y el valor de tu biblioteca.
        </p>
      </header>

      {statsLoading ? (
        <div className="flex flex-col gap-5" aria-label="Cargando">
          {[8, 2, 4].map((tiles, i) => (
            <div key={i} className="bg-surface border border-border rounded-card shadow-card p-[18px]">
              <Skeleton className="h-3.5 w-2/5 rounded-full mb-4" />
              <div className="grid grid-cols-2 gap-2.5">
                {Array.from({ length: tiles }, (_, j) => (
                  <StatTileSkeleton key={j} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
      <div className="flex flex-col gap-5 stagger-children">
        {/* 1. Resumen general */}
        <Card labelledBy="bit-resumen">
          <Eyebrow id="bit-resumen" icon={LayoutGrid} tone="pink" className="mb-3.5">Resumen general</Eyebrow>
          <div className="grid grid-cols-2 gap-2.5">
            <StatTile tone="pink" label="Páginas leídas" value={stats.resumen.pagesRead.toLocaleString()} />
            <StatTile tone="orange" label="Tiempo escuchado" value={formatDuration(stats.resumen.audioSeconds)} />
            <StatTile tone="magenta" label="Libros terminados" value={String(stats.resumen.finishedCount)} />
            <StatTile label="Libros en proceso" value={String(stats.resumen.readingCount)} />
            <StatTile tone="pink" label="Libros deseados" value={String(stats.resumen.wishlistCount)} />
            <StatTile tone="orange" label="Libros abandonados" value={String(stats.resumen.abandonedCount)} />
            <StatTile tone="magenta" label="Sagas registradas" value={String(stats.resumen.sagaCount)} />
            <StatTile label="Reseñas escritas" value={String(stats.resumen.reviewCount)} />
          </div>
          {memberSinceLabel && <Footnote>Leyendo en Teleo desde {memberSinceLabel}</Footnote>}
        </Card>

        {/* 2. Ritmo y hábito */}
        <Card labelledBy="bit-ritmo">
          <Eyebrow id="bit-ritmo" icon={Flame} tone="orange" className="mb-3.5">
            Ritmo y hábito
          </Eyebrow>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-orange-tint border border-border rounded-2xl p-3.5 flex items-center gap-3">
              <span className="w-10 h-10 shrink-0 rounded-full bg-orange-soft text-orange-text flex items-center justify-center">
                <Flame size={20} fill="currentColor" />
              </span>
              <div className="min-w-0">
                <p className="font-display font-semibold text-[22px] leading-none text-text tabular-nums">{currentStreak}</p>
                <p className="text-body-sm text-text-secondary mt-1">Racha actual</p>
              </div>
            </div>
            <div className="bg-pink-tint border border-border rounded-2xl p-3.5 flex items-center gap-3">
              <span className="w-10 h-10 shrink-0 rounded-full bg-pink-soft text-pink-text flex items-center justify-center">
                <Trophy size={19} />
              </span>
              <div className="min-w-0">
                <p className="font-display font-semibold text-[22px] leading-none text-text tabular-nums">{stats.ritmo.longestStreak}</p>
                <p className="text-body-sm text-text-secondary mt-1">Racha más larga</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-5 mb-3">
            <SubLabel>Días de lectura</SubLabel>
            <div className="flex items-center gap-1.5 -mt-2.5">
              <button
                onClick={() => setMonthsBack((m) => m + 2)}
                aria-label="Ver 2 meses anteriores"
                className="w-8 h-8 rounded-full border border-border bg-surface-2 text-primary-text flex items-center justify-center"
              >
                <ChevronLeft size={18} strokeWidth={2} />
              </button>
              <button
                onClick={() => setMonthsBack((m) => Math.max(0, m - 2))}
                disabled={monthsBack === 0}
                aria-label="Ver 2 meses siguientes"
                className="w-8 h-8 rounded-full border border-border bg-surface-2 text-primary-text flex items-center justify-center disabled:opacity-30"
              >
                <ChevronRight size={18} strokeWidth={2} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <MonthCalendar year={olderMonth.year} month={olderMonth.month} markedDates={markedDates} />
            <MonthCalendar year={newerMonth.year} month={newerMonth.month} markedDates={markedDates} />
          </div>

          <div className="flex items-center justify-center gap-1.5 mt-4 text-body-sm text-text-secondary">
            <span className="w-2.5 h-2.5 rounded-xs bg-surface-2 border border-border" />
            Sin marcar
            <span className="w-2.5 h-2.5 rounded-xs ml-3 bg-orange" />
            Leído
          </div>
        </Card>

        {/* 3. Desglose de colección */}
        <Card labelledBy="bit-coleccion">
          <Eyebrow id="bit-coleccion" icon={Library} tone="magenta" className="mb-3.5">Desglose de colección</Eyebrow>
          <div className="space-y-5">
            <BreakdownList title="Por categoría" entries={stats.coleccion.byCategory} />
            <BreakdownList title="Por formato" entries={stats.coleccion.byFormat} />
            <BreakdownList title="Por idioma" entries={stats.coleccion.byLanguage} />
          </div>
          <div className="grid grid-cols-2 gap-2.5 mt-5">
            <StatTile
              label="Libro más largo"
              value={stats.coleccion.longestBook ? `${stats.coleccion.longestBook.title} (${stats.coleccion.longestBook.value} pág.)` : '—'}
            />
            <StatTile
              label="Libro más corto"
              value={stats.coleccion.shortestBook ? `${stats.coleccion.shortestBook.title} (${stats.coleccion.shortestBook.value} pág.)` : '—'}
            />
          </div>
        </Card>

        {/* 4. Autores y series */}
        <Card labelledBy="bit-autores">
          <Eyebrow id="bit-autores" icon={Users} tone="pink" className="mb-3.5">
            Autores y series
          </Eyebrow>
          <div className="grid grid-cols-2 gap-2.5">
            <StatTile
              label="Autor más leído"
              value={stats.autoresYSeries.topAuthor ? `${stats.autoresYSeries.topAuthor.label} (${stats.autoresYSeries.topAuthor.count})` : '—'}
            />
            <StatTile
              label="Libro más releído"
              value={stats.autoresYSeries.mostRereadBook ? `${stats.autoresYSeries.mostRereadBook.label} (${stats.autoresYSeries.mostRereadBook.count}x)` : '—'}
            />
            <StatTile label="Sagas terminadas" value={String(stats.autoresYSeries.sagasCompleted)} />
            <StatTile label="Sagas en proceso" value={String(stats.autoresYSeries.sagasInProgress)} />
          </div>
        </Card>

        {/* 5. Calificaciones */}
        <Card labelledBy="bit-calificaciones">
          <Eyebrow id="bit-calificaciones" icon={Star} tone="orange" className="mb-3.5">
            Calificaciones
          </Eyebrow>
          <div className="flex flex-col items-center gap-2 mb-5">
            <span className="font-display font-semibold text-[40px] leading-none text-text tabular-nums">
              {avgRatingRounded != null ? avgRatingRounded.toFixed(1) : '—'}
            </span>
            <RatingRow shape="star" color="var(--color-orange)" value={avgRatingRounded ?? 0} size={20} />
            {avgRatingRounded != null && (
              <p className="text-body-sm text-text-secondary text-center">Promedio entre todos los libros que calificaste</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <StatTile label="Mejor calificado" value={stats.calificaciones.bestRated?.title ?? '—'} />
            <StatTile label="Peor calificado" value={stats.calificaciones.worstRated?.title ?? '—'} />
            <StatTile label="Citas guardadas" value={String(stats.calificaciones.quotesCount)} className="col-span-2" />
          </div>
          {stats.calificaciones.hasTie && (
            <Footnote>
              Si hay más de un libro con la misma calificación más alta o más baja, se mostrará uno al azar entre los empatados en cada visita a Bitácora.
            </Footnote>
          )}
        </Card>

        {/* 6. Historial anual */}
        <Card labelledBy="bit-historial">
          <Eyebrow id="bit-historial" icon={CalendarDays} tone="magenta" className="mb-3.5">Historial anual</Eyebrow>
          <div className="grid grid-cols-2 gap-2.5">
            <StatTile label={`Libros en ${currentYear}`} value={String(stats.historialAnual.currentYearCount)} />
            <StatTile label={`Libros en ${currentYear - 1}`} value={String(stats.historialAnual.previousYearCount)} />
          </div>

          <div className="mt-5">
            <SubLabel>{`Recap mensual ${currentYear}`}</SubLabel>
            <BarChart
              data={stats.historialAnual.monthlyThisYear.map((m) => ({ label: MONTH_ABBR[m.month - 1], value: m.count }))}
              color="var(--color-magenta)"
              highlightIndex={new Date().getMonth()}
              highlightColor="var(--color-orange)"
            />
          </div>

          {yearsInBooks.length > 0 && (
            <div className="mt-5">
              <SubLabel>Mis años en libros</SubLabel>
              <div className="grid grid-cols-2 gap-2.5">
                {yearsInBooks.map(({ year, count, goal }) => {
                  const metGoal = typeof goal === 'number' && goal > 0 && count >= goal
                  const subtitle =
                    typeof goal === 'number'
                      ? `${count} de ${goal} libros`
                      : `${count} libro${count === 1 ? '' : 's'} terminado${count === 1 ? '' : 's'}`

                  return (
                    <button
                      key={year}
                      onClick={() => setSelectedYear(year)}
                      className="relative bg-surface-2 border border-border rounded-2xl p-4 text-center active:opacity-80 transition-opacity focus-visible:outline-2 focus-visible:outline-primary-text"
                    >
                      {metGoal && (
                        <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-pink flex items-center justify-center" title="Meta cumplida">
                          <Check size={13} strokeWidth={2.5} className="text-surface" />
                        </span>
                      )}
                      <p className="font-title text-[30px] leading-none text-primary-text">{year}</p>
                      <p className="text-body-sm text-text-secondary mt-1.5">{subtitle}</p>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </Card>

        {/* 7. Valor de tu biblioteca */}
        <Card labelledBy="bit-valor">
          <Eyebrow id="bit-valor" icon={Coins} className="mb-3.5">
            Valor de tu biblioteca
          </Eyebrow>
          <div className="grid grid-cols-2 gap-2.5">
            <StatTile label="Total invertido" value={formatCurrency(stats.valorBiblioteca.totalInvested, currency)} />
            <StatTile label="Promedio por libro" value={formatCurrency(stats.valorBiblioteca.avgPerBook, currency)} />
            <StatTile
              label="Libro más caro"
              value={
                stats.valorBiblioteca.mostExpensive
                  ? `${stats.valorBiblioteca.mostExpensive.title} (${formatCurrency(stats.valorBiblioteca.mostExpensive.value, currency)})`
                  : '—'
              }
              className="col-span-2"
            />
            <StatTile
              label="Costo de completar deseados"
              value={stats.valorBiblioteca.wishlistWithPriceCount > 0 ? formatCurrency(stats.valorBiblioteca.wishlistCost, currency) : '—'}
              className="col-span-2"
            />
          </div>
          <Footnote>
            {stats.valorBiblioteca.booksWithPriceCount === 0
              ? 'Agrega el precio de tus libros al editarlos para ver el valor de tu biblioteca. '
              : ''}
            Puedes cambiar la moneda en Configuración.
          </Footnote>
        </Card>
      </div>
      )}

      <div className="pb-28" />
      <TabBar active="bitacora" onChange={handleTabBarChange} />

      <YearBooksModal isOpen={selectedYear !== null} onClose={() => setSelectedYear(null)} userId={user?.id} year={selectedYear} />
    </div>
  )
}
