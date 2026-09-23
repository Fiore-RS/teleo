import { supabase } from '../lib/supabase'
import { useCachedQuery } from './useCachedQuery'

/** Cuántas veces se ha completado un libro en total — una fila en `reading_history` por
 *  cada vez que se terminó de leer, incluida la primera. Se usa en Detalle del Libro para
 *  mostrar "Leído X veces" cuando ya se releyó al menos una vez (count > 1). */
export function useBookReadCount(bookId: string | undefined) {
  const { data: count, refetch } = useCachedQuery(
    ['bookReadCount', bookId],
    async () => {
      const { count: total } = await supabase
        .from('reading_history')
        .select('*', { count: 'exact', head: true })
        .eq('book_id', bookId!)
      return total ?? 0
    },
    0,
    { enabled: !!bookId }
  )

  return { count, refetch }
}
