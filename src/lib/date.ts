/** Formatea una fecha en `YYYY-MM-DD` usando la hora LOCAL del dispositivo (no UTC).
 *  `Date.prototype.toISOString()` siempre da la fecha en UTC, lo que puede quedar
 *  desalineado con el día calendario real de la persona según su huso horario — por eso
 *  no se usa para cosas como "el día de hoy" en la racha de lectura. */
export function formatLocalDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** La fecha de hoy en `YYYY-MM-DD`, en hora local. */
export function todayLocalDate(): string {
  return formatLocalDate(new Date())
}
