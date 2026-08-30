import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Flag, Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { useLibraryStats, type CountEntry } from '../hooks/useLibraryStats'
import { useGoalHistory } from '../hooks/useGoalHistory'
import { useReadingStreak } from '../hooks/useReadingStreak'
import { SectionHeader } from '../assets/components/atoms/SectionHeader'
import { StatBox } from '../assets/components/atoms/StatBox'
import { ProgressBar } from '../assets/components/atoms/ProgressBar'
import { BarChart } from '../assets/components/atoms/BarChart'
import { MonthCalendar } from '../assets/components/atoms/MonthCalendar'
import { RatingRow } from '../assets/components/molecules/RatingRow'
import { YearBooksModal } from '../assets/components/molecules/YearBooksModal'
import { TabBar, type TabKey } from '../assets/components/molecules/TabBar'
import { formatCurrency } from '../lib/currencies'
import { formatDuration } from '../lib/progress'

const MONTH_ABBR = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

// 2026-08-30 (feedback de Fiorella): el título principal de la página usa el mismo header
// que las demás secciones (SectionHeader, itálico serif — ver más abajo), y los 7
// subtítulos de grupo usan el estilo de encabezado de Configuracion.tsx (SectionHeading:
// font-body semibold, sin itálica, divisora en píldora), pero un tamaño más grande
// (text-display-md en vez de text-body-lg) para que se lean como títulos de sección de
// página completa y no como los encabezados más chicos de una lista de ajustes.
function GroupHeader({ title }: { title: string }) {
  return (
    <div className="mb-3">
      <h3 className="font-body text-display-md font-semibold text-accent-wishlist">{title}</h3>
      <div className="h-1.5 rounded-full bg-border mt-2" />
    </div>
  )
}

function BreakdownList({ title, entries }: { title: string; entries: CountEntry[] }) {
  if (entries.length === 0) return null
  const total = entries.reduce((sum, e) => sum + e.count, 0)
  return (
    <div>
      <p className="text-body-md text-text-secondary mb-2">{title}</p>
      <div className="space-y-2.5">
        {entries.map((e) => (
          <div key={e.label}>
            <div className="flex items-center justify-between text-body-sm text-text mb-1">
              <span className="truncate">{e.label}</span>
              <span className="text-text-secondary shrink-0 ml-2">{e.count}</span>
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
  const { stats } = useLibraryStats(user?.id)
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
    <div className="min-h-screen bg-bg p-4">
      <div className="mt-4 space-y-10">
        <div>
          <SectionHeader title="Tu viaje literario" />
          <p className="text-body-md text-text-secondary mt-3">
            Aquí queda el registro de tu historia con la lectura: tu ritmo, tu colección y el valor de tu biblioteca.
          </p>
        </div>

        {/* 1. Resumen general — grilla de StatBox, igual que "Estadísticas" en Perfil hoy: sin card
            envolvente, porque cada StatBox ya trae su propia caja. */}
        <div>
          <GroupHeader title="Resumen general" />
          <div className="grid grid-cols-2 gap-x-4 gap-y-5">
            <StatBox label="Páginas leídas" value={stats.resumen.pagesRead.toLocaleString()} />
            <StatBox label="Tiempo escuchado" value={formatDuration(stats.resumen.audioSeconds)} />
            <StatBox label="Libros terminados" value={String(stats.resumen.finishedCount)} />
            <StatBox label="Libros en proceso" value={String(stats.resumen.readingCount)} />
            <StatBox label="Libros deseados" value={String(stats.resumen.wishlistCount)} />
            <StatBox label="Libros abandonados" value={String(stats.resumen.abandonedCount)} />
            <StatBox label="Sagas registradas" value={String(stats.resumen.sagaCount)} />
            <StatBox label="Reseñas escritas" value={String(stats.resumen.reviewCount)} />
          </div>
          {memberSinceLabel && (
            <p className="text-body-sm text-text-secondary text-center mt-4">
              Leyendo en Teleo desde {memberSinceLabel}
            </p>
          )}
        </div>

        {/* 2. Ritmo y hábito */}
        <div>
          <GroupHeader title="Ritmo y hábito" />
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface border border-border rounded-2xl p-5 text-center">
              <div className="w-10 h-10 rounded-full bg-accent-reading flex items-center justify-center mx-auto mb-2">
                <Flag size={18} className="text-surface" />
              </div>
              <p className="font-display text-display-md text-text">{currentStreak} días</p>
              <p className="text-body-sm text-text-secondary">Racha actual</p>
            </div>
            <div className="bg-surface border border-border rounded-2xl p-5 text-center">
              <div className="w-10 h-10 rounded-full bg-accent-finished flex items-center justify-center mx-auto mb-2">
                <Flag size={18} className="text-surface" />
              </div>
              <p className="font-display text-display-md text-text">{stats.ritmo.longestStreak} días</p>
              <p className="text-body-sm text-text-secondary">Tu racha más extensa</p>
            </div>
          </div>

          <div className="flex items-center justify-between mt-5 mb-3">
            <p className="text-body-md text-text-secondary">Días de lectura marcados</p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMonthsBack((m) => m + 2)}
                aria-label="Ver 2 meses anteriores"
                className="text-accent-wishlist p-1"
              >
                <ChevronLeft size={20} strokeWidth={2} />
              </button>
              <button
                onClick={() => setMonthsBack((m) => Math.max(0, m - 2))}
                disabled={monthsBack === 0}
                aria-label="Ver 2 meses siguientes"
                className="text-accent-wishlist p-1 disabled:opacity-30"
              >
                <ChevronRight size={20} strokeWidth={2} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <MonthCalendar year={olderMonth.year} month={olderMonth.month} markedDates={markedDates} />
            <MonthCalendar year={newerMonth.year} month={newerMonth.month} markedDates={markedDates} />
          </div>

          <div className="flex items-center justify-center gap-1.5 mt-4 text-body-sm text-text-secondary">
            <span className="w-2.5 h-2.5 rounded-xs" style={{ backgroundColor: 'var(--color-border)' }} />
            Sin marcar
            <span className="w-2.5 h-2.5 rounded-xs ml-2" style={{ backgroundColor: 'var(--color-accent-reading)' }} />
            Leído
          </div>
        </div>

        {/* 3. Desglose de colección */}
        <div>
          <GroupHeader title="Desglose de colección" />
          <div className="bg-surface border border-border rounded-2xl p-6 space-y-5">
            <BreakdownList title="Por categoría" entries={stats.coleccion.byCategory} />
            <BreakdownList title="Por formato" entries={stats.coleccion.byFormat} />
            <BreakdownList title="Por idioma" entries={stats.coleccion.byLanguage} />
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-5 mt-5">
            <StatBox
              label="Libro más largo"
              value={stats.coleccion.longestBook ? `${stats.coleccion.longestBook.title} (${stats.coleccion.longestBook.value} pág.)` : '—'}
            />
            <StatBox
              label="Libro más corto"
              value={stats.coleccion.shortestBook ? `${stats.coleccion.shortestBook.title} (${stats.coleccion.shortestBook.value} pág.)` : '—'}
            />
          </div>
        </div>

        {/* 4. Autores y series */}
        <div>
          <GroupHeader title="Autores y series" />
          <div className="grid grid-cols-2 gap-x-4 gap-y-5">
            <StatBox
              label="Autor más leído"
              value={stats.autoresYSeries.topAuthor ? `${stats.autoresYSeries.topAuthor.label} (${stats.autoresYSeries.topAuthor.count})` : '—'}
            />
            <StatBox
              label="Libro más releído"
              value={stats.autoresYSeries.mostRereadBook ? `${stats.autoresYSeries.mostRereadBook.label} (${stats.autoresYSeries.mostRereadBook.count}x)` : '—'}
            />
            <StatBox label="Sagas terminadas" value={String(stats.autoresYSeries.sagasCompleted)} />
            <StatBox label="Sagas en proceso" value={String(stats.autoresYSeries.sagasInProgress)} />
          </div>
        </div>

        {/* 5. Calificaciones */}
        <div>
          <GroupHeader title="Calificaciones" />
          <div className="flex items-center justify-center gap-3 mb-5">
            <RatingRow shape="star" color="var(--color-accent-reading)" value={avgRatingRounded ?? 0} size={22} />
            <span className="font-display text-display-md text-text">
              {avgRatingRounded != null ? avgRatingRounded.toFixed(1) : '—'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-5">
            <StatBox label="Mejor calificado" value={stats.calificaciones.bestRated?.title ?? '—'} />
            <StatBox label="Peor calificado" value={stats.calificaciones.worstRated?.title ?? '—'} />
            <StatBox label="Citas guardadas" value={String(stats.calificaciones.quotesCount)} className="col-span-2" />
          </div>
          {avgRatingRounded != null && (
            <p className="text-body-sm text-text-secondary text-center mt-4">
              Esta es la calificación promedio entre todos los libros que has calificado.
            </p>
          )}
          {stats.calificaciones.hasTie && (
            <p className="text-body-sm text-text-secondary text-center mt-2">
              Si hay más de un libro con la misma calificación más alta o más baja, se mostrará uno al azar entre los empatados en cada visita a Bitácora.
            </p>
          )}
        </div>

        {/* 6. Historial anual */}
        <div>
          <GroupHeader title="Historial anual" />
          <div className="grid grid-cols-2 gap-x-4 gap-y-5">
            <StatBox label={`Libros en ${currentYear}`} value={String(stats.historialAnual.currentYearCount)} />
            <StatBox label={`Libros en ${currentYear - 1}`} value={String(stats.historialAnual.previousYearCount)} />
          </div>

          <p className="text-body-md text-text-secondary mt-5 mb-3">Recap mensual {currentYear}</p>
          <div className="bg-surface border border-border rounded-2xl p-6">
            <BarChart data={stats.historialAnual.monthlyThisYear.map((m) => ({ label: MONTH_ABBR[m.month - 1], value: m.count }))} />
          </div>

          {yearsInBooks.length > 0 && (
            <>
              <p className="text-body-md text-text-secondary mt-5 mb-3">Mis años en libros</p>
              <div className="grid grid-cols-2 gap-3">
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
                      className="relative bg-surface border border-border rounded-2xl p-4 text-center active:opacity-80 transition-opacity"
                    >
                      {metGoal && (
                        <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-accent-finished flex items-center justify-center">
                          <Check size={13} strokeWidth={2.5} className="text-surface" />
                        </span>
                      )}
                      <p className="font-display text-display-lg text-accent-wishlist">{year}</p>
                      <p className="text-body-sm text-text-secondary">{subtitle}</p>
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* 7. Valor de tu biblioteca — mismo tratamiento visual que el resto de los grupos,
            sin acento especial pese a ser la pieza central: grilla de StatBox bare, igual
            que Resumen general / Autores y series. */}
        <div>
          <GroupHeader title="Valor de tu biblioteca" />
          <div className="grid grid-cols-2 gap-x-4 gap-y-5">
            <StatBox label="Total invertido" value={formatCurrency(stats.valorBiblioteca.totalInvested, currency)} />
            <StatBox label="Promedio por libro" value={formatCurrency(stats.valorBiblioteca.avgPerBook, currency)} />
            <StatBox
              label="Libro más caro"
              value={
                stats.valorBiblioteca.mostExpensive
                  ? `${stats.valorBiblioteca.mostExpensive.title} (${formatCurrency(stats.valorBiblioteca.mostExpensive.value, currency)})`
                  : '—'
              }
              className="col-span-2"
            />
            <StatBox
              label="Costo de completar deseados"
              value={stats.valorBiblioteca.wishlistWithPriceCount > 0 ? formatCurrency(stats.valorBiblioteca.wishlistCost, currency) : '—'}
              className="col-span-2"
            />
          </div>
          <p className="text-body-sm text-text-secondary text-center mt-4">
            {stats.valorBiblioteca.booksWithPriceCount === 0
              ? 'Agrega el precio de tus libros al editarlos para ver el valor de tu biblioteca. '
              : ''}
            Puedes cambiar la moneda en Configuración.
          </p>
        </div>
      </div>

      <div className="pb-24" />
      <TabBar active="bitacora" onChange={handleTabBarChange} />

      <YearBooksModal isOpen={selectedYear !== null} onClose={() => setSelectedYear(null)} userId={user?.id} year={selectedYear} />
    </div>
  )
}
