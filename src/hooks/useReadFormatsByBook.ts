import { supabase } from '../lib/supabase'
import { fetchAllRows } from '../lib/fetchAllRows'
import { useCachedQuery } from './useCachedQuery'

const EMPTY: Record<string, string[]> = {}

/** Formatos en que se terminó cada libro (id del libro → formatos, sin repetir), desde el
 *  historial de lecturas (V.4.6.0). El filtro de formato del Estante muestra los libros que se
 *  leyeron alguna vez en ese formato: estos, más el de la lectura en curso. */
export function useReadFormatsByBook(userId: string | undefined): Record<string, string[]> {
  const { data } = useCachedQuery<Record<string, string[]>>(
    ['readFormatsByBook', userId],
    async () => {
      const rows = await fetchAllRows((from, to) =>
        supabase
          .from('reading_history')
          .select('id, book_id, format')
          .eq('user_id', userId!)
          .not('format', 'is', null)
          .order('id')
          .range(from, to)
      )
      const map: Record<string, string[]> = {}
      for (const { book_id, format } of rows) {
        if (!format) continue
        const list = (map[book_id] ??= [])
        if (!list.includes(format)) list.push(format)
      }
      return map
    },
    EMPTY,
    { enabled: !!userId }
  )
  return data
}
