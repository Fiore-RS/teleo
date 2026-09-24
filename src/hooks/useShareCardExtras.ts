import { supabase } from '../lib/supabase'
import { useCachedQuery } from './useCachedQuery'
import type { Database } from '../types/database'

type Book = Database['public']['Tables']['books']['Row']

export type ShareBook = Pick<Book, 'id' | 'title' | 'author' | 'cover_url'>
export type ShareReadingBook = Pick<
  Book,
  'id' | 'title' | 'author' | 'cover_url' | 'format' | 'total_pages' | 'current_page' | 'progress_percent' | 'total_duration_seconds' | 'current_duration_seconds'
>

interface ShareCardExtras {
  lastFinished: ShareBook | null
  lastFinishedRating: number | null
  /** Leyendo, del que empezaste más recientemente al más antiguo. */
  reading: ShareReadingBook[]
  /** Lista de temporada, en su orden. */
  seasonList: ShareBook[]
  /** Todos los pendientes, del agregado más recientemente al más antiguo. */
  pending: ShareBook[]
}

const EMPTY: ShareCardExtras = { lastFinished: null, lastFinishedRating: null, reading: [], seasonList: [], pending: [] }

/** Datos de los libros de la tarjeta story (fase 8): el último terminado (según
 *  reading_history, así cuenta una relectura) con su calificación, y las listas entre las
 *  que se eligen "Actual" (leyendo) y "Próxima" (lista de temporada o cualquier pendiente). */
export function useShareCardExtras(userId: string | undefined) {
  async function fetchExtras(): Promise<ShareCardExtras> {
    if (!userId) return EMPTY

    const [{ data: lastRead }, { data: reading }, { data: pending }] = await Promise.all([
      supabase
        .from('reading_history')
        .select('book_id, books(id, title, author, cover_url)')
        .eq('user_id', userId)
        .order('end_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('books')
        .select('id, title, author, cover_url, format, total_pages, current_page, progress_percent, total_duration_seconds, current_duration_seconds')
        .eq('user_id', userId)
        .eq('status', 'leyendo')
        .order('start_date', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false }),
      supabase
        .from('books')
        .select('id, title, author, cover_url, is_priority, priority_sort_order')
        .eq('user_id', userId)
        .eq('status', 'pendiente')
        .order('created_at', { ascending: false }),
    ])

    const lastFinished = ((lastRead as unknown as { books: ShareBook | null } | null)?.books) ?? null
    let lastFinishedRating: number | null = null
    if (lastFinished) {
      const { data: review } = await supabase
        .from('reviews')
        .select('general_rating')
        .eq('user_id', userId)
        .eq('book_id', lastFinished.id)
        .maybeSingle()
      lastFinishedRating = review?.general_rating ?? null
    }

    const allPending = pending ?? []
    const toShareBook = ({ id, title, author, cover_url }: ShareBook) => ({ id, title, author, cover_url })
    const seasonList = allPending
      .filter((b) => b.is_priority)
      .sort((a, b) => (a.priority_sort_order ?? 0) - (b.priority_sort_order ?? 0))
      .map(toShareBook)

    return {
      lastFinished,
      lastFinishedRating,
      reading: (reading ?? []) as ShareReadingBook[],
      seasonList,
      pending: allPending.map(toShareBook),
    }
  }

  const { data, isLoading } = useCachedQuery(['shareCardExtras', userId], fetchExtras, EMPTY, { enabled: !!userId })
  return { ...data, isLoading }
}
