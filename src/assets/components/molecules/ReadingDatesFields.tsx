import { DateInput } from '../atoms/DateInput'
import { readingDatesAreValid, type ReadingDates } from '../../../lib/readingDates'

interface ReadingDatesFieldsProps extends ReadingDates {
  onChange: (dates: ReadingDates) => void
  className?: string
}

/** Fechas de inicio y fin de una lectura terminada, con una línea que dice si cuenta para el
 *  reto anual. Se usa al terminar un libro, al agregarlo como terminado y en Editar detalles,
 *  para que las fechas nunca dependan de escribir una reseña. */
export function ReadingDatesFields({ startDate, endDate, onChange, className = '' }: ReadingDatesFieldsProps) {
  const labelClass = 'font-body font-semibold text-body-sm text-text-secondary block mb-1.5'
  const isValid = readingDatesAreValid({ startDate, endDate })

  let hint: string
  if (!isValid) hint = 'La fecha de inicio no puede ser posterior a la de fin.'
  else if (!endDate) hint = 'Sin fecha de fin, este libro no cuenta para tu reto anual.'
  else hint = `Cuenta para tu reto de ${endDate.slice(0, 4)}.`

  return (
    <div className={className}>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Fecha de inicio</label>
          <DateInput value={startDate} onChange={(e) => onChange({ startDate: e.target.value, endDate })} />
        </div>
        <div>
          <label className={labelClass}>Fecha de fin</label>
          <DateInput value={endDate} onChange={(e) => onChange({ startDate, endDate: e.target.value })} />
        </div>
      </div>
      <p className={`text-body-sm mt-2 ${isValid ? 'text-text-secondary' : 'text-primary-text'}`}>{hint}</p>
    </div>
  )
}
