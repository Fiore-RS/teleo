import { formatLocalDate } from '../../../lib/date'

// Semana de lunes a domingo, igual que la fila de la racha en La mesa.
const WEEKDAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
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

/** Un mes dibujado como calendario real (lunes a domingo, con el número de cada día
 *  adentro de su casilla). Rediseño 2026: los días leídos van en el verde de la racha (el
 *  mismo de la tarjeta de racha en La mesa) y hoy lleva un borde vino. */
export function MonthCalendar({ year, month, markedDates, className = '' }: MonthCalendarProps) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayKey = formatLocalDate(today)

  const daysInMonth = new Date(year, month, 0).getDate()
  const leadingBlanks = (new Date(year, month - 1, 1).getDay() + 6) % 7 // getDay(): 0 = domingo

  const cells: (Date | null)[] = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month - 1, i + 1)),
  ]

  return (
    <div className={className}>
      <p className="font-display font-semibold text-body-lg text-text mb-2">
        {MONTH_NAMES[month - 1]} <span className="text-text-secondary font-normal">{year}</span>
      </p>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAY_LABELS.map((label, i) => (
          <span key={i} className="text-[11px] font-semibold text-text-muted text-center">{label}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`blank-${i}`} />
          const key = formatLocalDate(day)
          const isFuture = day > today
          const isRead = !isFuture && markedDates.has(key)
          const isToday = key === todayKey
          return (
            <div
              key={key}
              className={`aspect-square rounded-md flex items-center justify-center text-[11px] font-semibold tabular-nums ${
                isRead
                  ? 'bg-accent-finished text-surface'
                  : isFuture
                    ? 'text-text-muted/60'
                    : 'bg-surface-2 text-text-secondary'
              } ${isToday ? 'ring-[1.5px] ring-primary-text' : ''}`}
            >
              {day.getDate()}
            </div>
          )
        })}
      </div>
    </div>
  )
}
