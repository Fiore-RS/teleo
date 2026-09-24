import { todayLocalDate } from './date'

/** Convierte "YYYY-MM-DD" a una fecha local (sin el corrimiento de huso horario de new Date(str)). */
export function parseLocalDate(value: string): Date {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Días que faltan para una fecha (0 = hoy, negativo = ya pasó). */
export function daysUntil(value: string): number {
  const today = parseLocalDate(todayLocalDate())
  return Math.round((parseLocalDate(value).getTime() - today.getTime()) / 86_400_000)
}

export function countdownLabel(value: string): string {
  const days = daysUntil(value)
  if (days === 0) return '¡Sale hoy!'
  if (days === 1) return 'Sale mañana'
  if (days > 1) return `Faltan ${days} días`
  return 'Ya salió'
}

const longFormat = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'long', year: 'numeric' })
const shortFormat = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short' })

export function formatReleaseDate(value: string, style: 'long' | 'short' = 'long'): string {
  return (style === 'long' ? longFormat : shortFormat).format(parseLocalDate(value))
}
