import { DateInput } from '../atoms/DateInput'
import { readingDatesAreValid, readingDaysLabel, type ReadingDates } from '../../../lib/readingDates'

interface ReadingDatesFieldsProps extends ReadingDates {
  onChange: (dates: ReadingDates) => void
  /** Nombre del segundo campo. Por defecto "Fecha de fin"; en un libro abandonado, "Lo dejaste". */
  endLabel?: string
  /** Línea que dice si la lectura cuenta para el reto anual. Solo aplica a libros terminados;
   *  el aviso de fechas inválidas se muestra siempre. */
  showGoalHint?: boolean
  /** Antepone a la línea de abajo los días que tomó la lectura ("Lo leíste en 19 días"). */
  showDays?: boolean
  className?: string
}

/** Fechas de inicio y fin de una lectura terminada, con una línea que dice si cuenta para el
 *  reto anual. Se usa al terminar un libro, al agregarlo como terminado y en Editar detalles,
 *  para que las fechas nunca dependan de escribir una reseña. */
export function ReadingDatesFields({
  startDate,
  endDate,
  onChange,
  endLabel = 'Fecha de fin',
  showGoalHint = true,
  showDays = false,
  className = '',
}: ReadingDatesFieldsProps) {
  const labelClass = 'font-body font-semibold text-body-sm text-text-secondary block mb-1.5'
  const isValid = readingDatesAreValid({ startDate, endDate })

  let hint: string | null
  if (!isValid) hint = 'La fecha de inicio no puede ser posterior a la de fin.'
  else if (!showGoalHint) hint = null
  else if (!endDate) hint = 'Sin fecha de fin, este libro no cuenta para tu reto anual.'
  else hint = `Cuenta para tu reto de ${endDate.slice(0, 4)}.`

  const days = showDays && isValid ? readingDaysLabel(startDate, endDate) : null
  if (days) hint = hint ? `Lo leíste en ${days} · ${hint}` : `Lo leíste en ${days}.`

  return (
    <div className={className}>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Fecha de inicio</label>
          <DateInput value={startDate} onChange={(e) => onChange({ startDate: e.target.value, endDate })} />
        </div>
        <div>
          <label className={labelClass}>{endLabel}</label>
          <DateInput value={endDate} onChange={(e) => onChange({ startDate, endDate: e.target.value })} />
        </div>
      </div>
      {hint && <p className={`text-body-sm mt-2 ${isValid ? 'text-text-secondary' : 'text-primary-text'}`}>{hint}</p>}
    </div>
  )
}
