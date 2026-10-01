export interface ReadingDates {
  startDate: string
  endDate: string
}

/** true si la fecha de inicio no es posterior a la de fin (o falta alguna de las dos). */
export function readingDatesAreValid({ startDate, endDate }: ReadingDates): boolean {
  return !startDate || !endDate || startDate <= endDate
}

/** Días que tomó una lectura, contando el primero y el último ("19 días"). Nada si falta
 *  alguna fecha o están al revés. */
export function readingDaysLabel(start: string | null | undefined, end: string | null | undefined): string | null {
  if (!start || !end) return null
  const [ys, ms, ds] = start.split('-').map(Number)
  const [ye, me, de] = end.split('-').map(Number)
  const diff = Math.round((Date.UTC(ye, me - 1, de) - Date.UTC(ys, ms - 1, ds)) / 86_400_000)
  if (Number.isNaN(diff) || diff < 0) return null
  const days = diff + 1
  return days === 1 ? '1 día' : `${days} días`
}
