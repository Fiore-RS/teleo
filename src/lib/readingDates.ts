export interface ReadingDates {
  startDate: string
  endDate: string
}

/** true si la fecha de inicio no es posterior a la de fin (o falta alguna de las dos). */
export function readingDatesAreValid({ startDate, endDate }: ReadingDates): boolean {
  return !startDate || !endDate || startDate <= endDate
}
