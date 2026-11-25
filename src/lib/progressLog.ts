import { supabase } from './supabase'
import { todayLocalDate } from './date'

/* Avances de lectura (V.4.6.0, migración 0046). Cada vez que se guarda el progreso o se termina
 * un libro, se anota cuánto se avanzó ese día (páginas y segundos), con el formato de la
 * lectura. Las páginas y el tiempo de un mes o un año salen de aquí (lib/readingAmounts.ts), así
 * cuentan en el mes en que se leyeron y no todo en el mes en que se terminó el libro. */

type ProgressBook = {
  id: string
  format: string | null
  total_pages: number | null
  total_duration_seconds: number | null
  current_page: number | null
  current_duration_seconds: number | null
}

async function insertLog(params: { userId: string | undefined; bookId: string; format: string | null; pages: number; seconds: number; date?: string }) {
  if (!params.userId || (params.pages === 0 && params.seconds === 0)) return
  await supabase.from('progress_log').insert({
    user_id: params.userId,
    book_id: params.bookId,
    logged_on: params.date ?? todayLocalDate(),
    pages: Math.round(params.pages),
    seconds: Math.round(params.seconds),
    format: params.format,
  })
}

/** Anota lo que cambió el progreso al guardarlo (puede ser negativo, si se corrigió hacia atrás:
 *  así la suma sigue siendo lo que se lleva). `after` son las columnas que se guardaron. */
export async function logProgressChange(
  userId: string | undefined,
  before: ProgressBook,
  after: { current_page?: number | null; current_duration_seconds?: number | null }
) {
  const pages = after.current_page != null ? after.current_page - (before.current_page ?? 0) : 0
  const seconds = after.current_duration_seconds != null ? after.current_duration_seconds - (before.current_duration_seconds ?? 0) : 0
  await insertLog({ userId, bookId: before.id, format: before.format, pages, seconds })
}

/** Al terminar un libro que se estaba leyendo, lo que faltaba hasta el final cuenta el día en
 *  que se terminó. Si se marca terminado sin haberlo llevado (desde Pendiente, por ejemplo), no
 *  se anota nada: el libro se reparte entre sus fechas de inicio y fin. */
export async function logFinish(userId: string | undefined, book: ProgressBook & { status: string }, endDate: string | null) {
  if (book.status !== 'leyendo' && book.status !== 'pausado') return
  const pages = book.total_pages ? Math.max(0, book.total_pages - (book.current_page ?? 0)) : 0
  const seconds = book.total_duration_seconds ? Math.max(0, book.total_duration_seconds - (book.current_duration_seconds ?? 0)) : 0
  await insertLog({ userId, bookId: book.id, format: book.format, pages, seconds, date: endDate ?? undefined })
}
