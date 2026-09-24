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
  /** 'lg' para el calendario de lectura a pantalla completa (números más grandes). */
  size?: 'sm' | 'lg'
  /** false cuando la pantalla ya muestra el nombre del mes en su propio encabezado. */
  showTitle?: boolean
  /** 'reading': días leídos en naranja, el futuro apagado (racha).
   *  'events': días con algo marcado en magenta, también en el futuro (lanzamientos). */
  variant?: 'reading' | 'events'
  /** Si se pasa, cada día es un botón. */
  onDayClick?: (date: string) => void
  selectedDate?: string | null
}

/** Un mes dibujado como calendario real (lunes a domingo, con el número de cada día
 *  adentro de su casilla). Los días leídos van en el naranja de la racha (el mismo de la
 *  tarjeta de racha en Mesa) y hoy lleva un borde vino. */
export function MonthCalendar({ year, month, markedDates, className = '', size = 'sm', showTitle = true, variant = 'reading', onDayClick, selectedDate }: MonthCalendarProps) {
  const isEvents = variant === 'events'
  const isLarge = size === 'lg'
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
      {showTitle && (
        <p className="font-display font-semibold text-body-lg text-text mb-2">
          {MONTH_NAMES[month - 1]} <span className="text-text-secondary font-normal">{year}</span>
        </p>
      )}
      <div className={`grid grid-cols-7 mb-1 ${isLarge ? 'gap-1.5' : 'gap-1'}`}>
        {WEEKDAY_LABELS.map((label, i) => (
          <span key={i} className={`${isLarge ? 'text-body-sm' : 'text-[11px]'} font-semibold text-text-muted text-center`}>{label}</span>
        ))}
      </div>
      <div className={`grid grid-cols-7 ${isLarge ? 'gap-1.5' : 'gap-1'}`}>
        {cells.map((day, i) => {
          if (!day) return <div key={`blank-${i}`} />
          const key = formatLocalDate(day)
          const isFuture = day > today
          const isMarked = markedDates.has(key) && (isEvents || !isFuture)
          const isToday = key === todayKey
          const isSelected = selectedDate === key
          const colors = isSelected
            ? 'bg-primary text-primary-ink'
            : isMarked
              ? isEvents
                ? 'bg-magenta text-on-accent'
                : 'bg-orange text-on-accent'
              : isFuture && !isEvents
                ? 'text-text-muted/60'
                : 'bg-surface-2 text-text-secondary'
          const cellClass = `aspect-square flex items-center justify-center font-semibold tabular-nums ${isLarge ? 'rounded-lg text-body-md' : 'rounded-md text-[11px]'} ${colors} ${
            isToday && !isSelected ? 'ring-[1.5px] ring-primary-text' : ''
          }`
          return onDayClick ? (
            <button
              key={key}
              type="button"
              onClick={() => onDayClick(key)}
              aria-pressed={isSelected}
              aria-label={`${day.getDate()} de ${MONTH_NAMES[month - 1].toLowerCase()}${isMarked ? ', con lanzamiento' : ''}`}
              className={`${cellClass} focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary-text`}
            >
              {day.getDate()}
            </button>
          ) : (
            <div key={key} className={cellClass}>
              {day.getDate()}
            </div>
          )
        })}
      </div>
    </div>
  )
}
