import { supabase } from '../lib/supabase'
import { useCachedQuery } from './useCachedQuery'

export interface ReadHistoryEntry {
  id: string
  start_date: string | null
  end_date: string
}

const EMPTY: ReadHistoryEntry[] = []

/** Todas las lecturas completas registradas de un libro (una fila en `reading_history` por
 *  cada vez que se terminó de leer), de más reciente a más antigua. Se usa en la Reseña para
 *  mostrar las fechas de relecturas anteriores, además de las fechas del ciclo actual que ya
 *  se muestran arriba (esas siguen viniendo de `books.start_date`/`end_date`). */
export function useBookHistory(bookId: string | undefined) {
  const { data: history, isLoading, refetch } = useCachedQuery(
    ['bookHistory', bookId],
    async () => {
      const { data } = await supabase
        .from('reading_history')
        .select('id, start_date, end_date')
        .eq('book_id', bookId!)
        .order('end_date', { ascending: false })
      return (data ?? []) as ReadHistoryEntry[]
    },
    EMPTY,
    { enabled: !!bookId }
  )

  return { history, isLoading, refetch }
}
