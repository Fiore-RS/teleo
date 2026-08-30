import { formatLocalDate } from '../../../lib/date'

const WEEKDAY_LABELS = ['D', 'L', 'M', 'M', 'J', 'V', 'S']
const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

interface MonthCalendarProps {
  year: number
  month: number // 1-12
  markedDates: Set<string>
  className?: string
}

/** Un mes dibujado como calendario real (domingo a sábado, con el número de cada día
 *  adentro de su casilla) — reemplaza al heatmap estilo GitHub (2026-08-30, feedback de
 *  Fiorella): 52 semanas en una tira horizontal costaba trabajo de leer: un calendario de
 *  toda la vida es más intuitivo, aunque solo muestre un par de meses a la vez. */
export function MonthCalendar({ year, month, markedDates, className = '' }: MonthCalendarProps) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const daysInMonth = new Date(year, month, 0).getDate()
  const leadingBlanks = new Date(year, month - 1, 1).getDay()

  const cells: (Date | null)[] = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month - 1, i + 1)),
  ]

  return (
    <div className={className}>
      <p className="text-body-md font-body font-semibold text-text mb-2">
        {MONTH_NAMES[month - 1]} {year}
      </p>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAY_LABELS.map((label, i) => (
          <span key={i} className="text-body-sm text-text-secondary text-center">{label}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`blank-${i}`} />
          const isFuture = day > today
          const isRead = !isFuture && markedDates.has(formatLocalDate(day))
          return (
            <div
              key={formatLocalDate(day)}
              className="aspect-square rounded-md flex items-center justify-center text-body-sm"
              style={{
                backgroundColor: isFuture ? 'transparent' : isRead ? 'var(--color-accent-reading)' : 'var(--color-border)',
                color: isRead ? 'var(--color-surface)' : 'var(--color-text-secondary)',
              }}
            >
              {day.getDate()}
            </div>
          )
        })}
      </div>
    </div>
  )
}
