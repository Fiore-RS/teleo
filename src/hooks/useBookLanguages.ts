import { supabase } from '../lib/supabase'
import { useCachedQuery } from './useCachedQuery'

const EMPTY: (string | null)[] = []

/** Idiomas que ya tienen los libros de la persona (sin repetir), para armar el menú de
 *  idioma en Editar libro sin tener que cargar la biblioteca completa. */
export function useBookLanguages(userId: string | undefined) {
  const { data } = useCachedQuery<(string | null)[]>(
    ['bookLanguages', userId],
    async () => {
      const { data } = await supabase
        .from('books')
        .select('language')
        .eq('user_id', userId!)
        .not('language', 'is', null)
      return Array.from(new Set((data ?? []).map((b) => b.language)))
    },
    EMPTY,
    { enabled: !!userId }
  )
  return data
}
