import type { Database } from '../types/database'

type Book = Database['public']['Tables']['books']['Row']

export function getProgressInfo(book: Book): { percent: number; label?: string } {
  if (book.format === 'audiolibro' && book.total_duration_seconds) {
    const percent = ((book.current_duration_seconds ?? 0) / book.total_duration_seconds) * 100
    return { percent, label: formatDuration(book.current_duration_seconds ?? 0) }
  }
  if (book.total_pages) {
    const percent = ((book.current_page ?? 0) / book.total_pages) * 100
    return { percent, label: `Pág. ${book.current_page ?? 0}` }
  }
  return { percent: 0 }
}

export function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  if (h > 0) {
    return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`
  }
  return `${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`
}