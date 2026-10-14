import { supabase } from '../lib/supabase'
import { fetchAllRows } from '../lib/fetchAllRows'
import { useCachedQuery } from './useCachedQuery'

const EMPTY: Record<string, string[]> = {}

/** Etiquetas de cada libro de la persona (id del libro → etiquetas), para filtrar Estante por
 *  etiqueta (V.3.1.0). Se refresca con queryClient.invalidateQueries({ queryKey: ['tagsByBook'] }). */
export function useTagsByBook(userId: string | undefined): Record<string, string[]> {
  const { data } = useCachedQuery<Record<string, string[]>>(
    ['tagsByBook', userId],
    async () => {
      const rows = await fetchAllRows((from, to) =>
        supabase
          .from('book_tags')
          .select('book_id, tag, books!inner(user_id)')
          .eq('books.user_id', userId!)
          .order('book_id')
          .order('tag')
          .range(from, to)
      )
      const map: Record<string, string[]> = {}
      for (const { book_id, tag } of rows) (map[book_id] ??= []).push(tag)
      return map
    },
    EMPTY,
    { enabled: !!userId }
  )
  return data
}
