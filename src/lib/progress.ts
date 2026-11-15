import type { Database } from '../types/database'

type Book = Database['public']['Tables']['books']['Row']

type ProgressFields = Pick<Book, 'format' | 'total_duration_seconds' | 'current_duration_seconds' | 'progress_percent' | 'total_pages' | 'current_page'>

export function getProgressInfo(book: ProgressFields): { percent: number; label?: string } {
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
/** V.4.5.1: "14 h 32 min", "14 h" o "45 min", para el tiempo escuchado en Resumen y el ticket. */
export function formatListenTime(totalSeconds: number): string {
  const totalMinutes = Math.round(Math.max(0, totalSeconds) / 60)
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  if (h === 0) return `${m} min`
  return m === 0 ? `${h} h` : `${h} h ${m} min`
}

export function formatDuration(totalSeconds: number): string {
  const total = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}