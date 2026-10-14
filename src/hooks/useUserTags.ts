import { supabase } from '../lib/supabase'
import { fetchAllRows } from '../lib/fetchAllRows'
import { useCachedQuery } from './useCachedQuery'

const EMPTY: string[] = []

/** Etiquetas propias que la persona ya usó en sus libros (V.3.1.0), de la más usada a la menos,
 *  para ofrecerlas al editar cualquier libro. Se refresca con
 *  queryClient.invalidateQueries({ queryKey: ['userTags'] }) después de agregar una. */
export function useUserTags(userId: string | undefined): string[] {
  const { data } = useCachedQuery<string[]>(
    ['userTags', userId],
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
      const counts = new Map<string, { label: string; count: number }>()
      for (const { tag } of rows) {
        const key = normalizeTag(tag)
        if (!key) continue
        const entry = counts.get(key)
        if (entry) entry.count++
        else counts.set(key, { label: tag.trim(), count: 1 })
      }
      return [...counts.values()]
        .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'es'))
        .map((e) => e.label)
    },
    EMPTY,
    { enabled: !!userId }
  )
  return data
}

/** Minúsculas y sin tildes: "fantasia" y "Fantasía" son la misma etiqueta. */
export function normalizeTag(tag: string): string {
  return tag.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim().replace(/\s+/g, ' ')
}
