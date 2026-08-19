import type { Database } from '../types/database'

type Book = Database['public']['Tables']['books']['Row']

export function getProgressInfo(book: Book): { percent: number; label?: string } {
  if (book.format === 'audiolibro' && book.total_duration_seconds) {
    const percent = ((book.current_duration_seconds ?? 0) / book.total_duration_seconds) * 100
    return { percent, label: formatDuration(book.current_duration_seconds ?? 0) }
  }
  if (book.format === 'digital') {
    const percent = book.progress_percent ?? 0
    return { percent }
  }
  if (book.total_pages) {
    const percent = ((book.current_page ?? 0) / book.total_pages) * 100
    return { percent, label: `Pág. ${book.current_page ?? 0}` }
  }
  return { percent: 0 }
}

/** Formatea segundos como hh:mm:ss, siempre con las 3 unidades (para que "tiempo
 *  escuchado" se lea igual en toda la app: stat de Perfil, progreso de audiolibro
 *  en Mesa/DetalleSaga, totales del modal "Libros leídos en 20XX", etc.) */
export function formatDuration(totalSeconds: number): string {
  const total = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}