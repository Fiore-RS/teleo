import type { Database } from '../../types/database'
import { formatDuration } from '../../lib/progress'

type Book = Database['public']['Tables']['books']['Row']

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

/** "2 de noviembre" a partir de una fecha guardada como AAAA-MM-DD (sin pasar por UTC). */
export function shortDate(value: string) {
  const [y, m, d] = value.slice(0, 10).split('-').map((n) => parseInt(n, 10))
  const sameYear = y === new Date().getFullYear()
  return `${d} de ${MONTHS[m - 1]}${sameYear ? '' : ` de ${y}`}`
}

/** "Página 312 de 502", "01:20:00 de 09:15:00" o nada (digital: solo el porcentaje). */
export function progressDetail(book: Book): string | null {
  if (book.format === 'audiolibro' && book.total_duration_seconds) {
    return `${formatDuration(book.current_duration_seconds ?? 0)} de ${formatDuration(book.total_duration_seconds)}`
  }
  if (book.format !== 'digital' && book.total_pages) return `Página ${book.current_page ?? 0} de ${book.total_pages}`
  return null
}

