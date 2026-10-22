import { supabase } from '../lib/supabase'
import { useCachedQuery } from './useCachedQuery'

export interface PendingBook {
  id: string
  title: string
  author: string | null
  cover_url: string | null
  is_priority: boolean
  priority_sort_order: number | null
}

const EMPTY: PendingBook[] = []

/** Todos los pendientes, con solo lo que muestra la hoja "Agregar libros" de Mis próximas
 *  lecturas (V.3.3.0): ordenados por título. */
export function usePendingBooks(userId: string | undefined) {
  const { data, isLoading } = useCachedQuery<PendingBook[]>(
    ['pendingBooks', userId],
    async () => {
      const { data, error } = await supabase
        .from('books')
        .select('id, title, author, cover_url, is_priority, priority_sort_order')
        .eq('user_id', userId!)
        .eq('status', 'pendiente')
        .order('title', { ascending: true })
      if (error) throw error
      return data ?? []
    },
    EMPTY,
    { enabled: Boolean(userId) },
  )
  return { books: data, isLoading }
}
