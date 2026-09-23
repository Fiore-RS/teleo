import { supabase } from '../lib/supabase'
import { useCachedQuery } from './useCachedQuery'
import type { Database } from '../types/database'
import { computeMidpointOrder } from '../lib/reorder'

type Book = Database['public']['Tables']['books']['Row']

/** Libros "pendiente" marcados como prioridad de lectura ("Mi lista de esta temporada" en
 *  Mesa) — un subconjunto de la lista general de pendientes, ordenable por separado. Se
 *  limpia solo (vía trigger en la base de datos) en cuanto un libro deja de estar
 *  "pendiente", así que este hook solo necesita filtrar por `is_priority`. */
const EMPTY: Book[] = []

export function usePriorityBooks(userId: string | undefined) {
  const { data: books, setData: setBooks, isLoading, refetch } = useCachedQuery<Book[]>(
    ['priorityBooks', userId],
    async () => {
      const { data } = await supabase
        .from('books')
        .select('*')
        .eq('user_id', userId!)
        .eq('status', 'pendiente')
        .eq('is_priority', true)
        .order('priority_sort_order', { ascending: true })
        .order('created_at', { ascending: true })
      return data ?? []
    },
    EMPTY,
    { enabled: !!userId }
  )

  // beforeId/afterId son los vecinos INMEDIATOS visibles en la lista actual, igual que en
  // useLibraryBooks.reorderBook.
  async function reorderBook(bookId: string, beforeId: string | null, afterId: string | null) {
    const beforeOrder = beforeId ? books.find((b) => b.id === beforeId)?.priority_sort_order ?? null : null
    const afterOrder = afterId ? books.find((b) => b.id === afterId)?.priority_sort_order ?? null : null
    const newOrder = computeMidpointOrder(beforeOrder, afterOrder)

    setBooks((prev) =>
      prev
        .map((b) => (b.id === bookId ? { ...b, priority_sort_order: newOrder } : b))
        .sort((a, b) => (a.priority_sort_order ?? 0) - (b.priority_sort_order ?? 0))
    )

    await supabase.from('books').update({ priority_sort_order: newOrder }).eq('id', bookId)
  }

  // Pasa el libro a "leyendo" — lo saca de esta lista automáticamente (el trigger de la base
  // de datos limpia is_priority en cuanto el estado deja de ser "pendiente").
  async function startReading(bookId: string, startDate: string | null) {
    await supabase
      .from('books')
      .update({ status: 'leyendo', ...(startDate ? { start_date: startDate } : {}) })
      .eq('id', bookId)
    setBooks((prev) => prev.filter((b) => b.id !== bookId))
  }

  return { books, isLoading, refetch, reorderBook, startReading }
}
