import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useReadingStreak } from '../../../hooks/useReadingStreak'
import { useMonthReading } from '../../../hooks/useMonthReading'
import { Sheet } from '../atoms/Sheet'
import { MonthCalendar } from '../atoms/MonthCalendar'
import { StatTile } from '../atoms/StatTile'
import { Skeleton } from '../atoms/Skeleton'
import { StreakTiles } from './StreakTiles'

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

interface ReadingCalendarSheetProps {
  userId: string | undefined
  onClose: () => void
}

/** Calendario de lectura (fase 3, ideas 1 y 4a del plan). Hoja que baja desde arriba al tocar
 *  la racha de Mesa, como el resto de los despliegues de la app. Muestra la racha actual y la
 *  más larga, y un mes a la vez con los días leídos marcados, con flechas para ir a meses
 *  anteriores (no pasa del mes actual). Debajo, los números de ese mes: días leídos, libros
 *  terminados y páginas. Se monta al abrirse, así siempre arranca en el mes actual. */
export function ReadingCalendarSheet({ userId, onClose }: ReadingCalendarSheetProps) {
  const { streak, markedDates, longestStreak, isLoading: streakLoading } = useReadingStreak(userId)
  const [monthsBack, setMonthsBack] = useState(0)

  const now = new Date()
  const shown = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1)
  const year = shown.getFullYear()
  const month = shown.getMonth() + 1
  const monthPrefix = `${year}-${String(month).padStart(2, '0')}-`

  const { finishedCount, pages, isLoading: monthLoading } = useMonthReading(userId, year, month)
  const daysRead = [...markedDates].filter((d) => d.startsWith(monthPrefix)).length


  return (
    <Sheet onClose={onClose} title="Calendario de lectura">
      {/* Rachas: los mismos recuadros que en Bitácora */}
      {streakLoading ? (
        <div className="grid grid-cols-2 gap-2.5">
          <Skeleton className="h-[70px] rounded-2xl" />
          <Skeleton className="h-[70px] rounded-2xl" />
        </div>
      ) : (
        <StreakTiles current={streak} longest={longestStreak} />
      )}

      {/* Mes */}
      <div className="flex items-center justify-between gap-3 mt-6 mb-3">
        <button
          type="button"
          onClick={() => setMonthsBack((m) => m + 1)}
          aria-label="Mes anterior"
          className="w-9 h-9 rounded-full border border-border bg-surface-2 text-primary-text flex items-center justify-center"
        >
          <ChevronLeft size={18} strokeWidth={2} />
        </button>
        <p className="font-display font-semibold text-display-md text-text" aria-live="polite">
          {MONTH_NAMES[month - 1]} <span className="text-text-secondary font-normal">{year}</span>
        </p>
        <button
          type="button"
          onClick={() => setMonthsBack((m) => Math.max(0, m - 1))}
          disabled={monthsBack === 0}
          aria-label="Mes siguiente"
          className="w-9 h-9 rounded-full border border-border bg-surface-2 text-primary-text flex items-center justify-center disabled:opacity-30"
        >
          <ChevronRight size={18} strokeWidth={2} />
        </button>
      </div>

      <MonthCalendar year={year} month={month} markedDates={markedDates} size="lg" showTitle={false} />

      <div className="flex items-center justify-center gap-1.5 mt-4 text-body-sm text-text-secondary">
        <span className="w-2.5 h-2.5 rounded-xs bg-surface-2 border border-border" />
        Sin marcar
        <span className="w-2.5 h-2.5 rounded-xs ml-3 bg-orange" />
        Leído
      </div>

      <div className="grid grid-cols-3 gap-2 mt-5">
        <StatTile tone="orange" label="Días leídos" value={streakLoading ? '·' : String(daysRead)} />
        <StatTile tone="magenta" label="Libros terminados" value={monthLoading ? '·' : String(finishedCount)} />
        <StatTile tone="pink" label="Páginas" value={monthLoading ? '·' : pages.toLocaleString()} />
      </div>
      <p className="text-body-sm text-text-muted text-center mt-3">
        Las páginas suman los libros que terminaste este mes.
      </p>
    </Sheet>
  )
}
