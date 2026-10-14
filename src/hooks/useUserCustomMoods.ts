import { supabase } from '../lib/supabase'
import { fetchAllRows } from '../lib/fetchAllRows'
import { useCachedQuery } from './useCachedQuery'

const EMPTY: string[] = []

/** Ánimos propios que la persona ya usó en sus libros (V.3.1.0), del más usado al menos usado,
 *  para ofrecerlos como opción en cualquier libro (igual que las etiquetas). Se refresca con
 *  queryClient.invalidateQueries({ queryKey: ['userCustomMoods'] }) después de guardar. */
export function useUserCustomMoods(userId: string | undefined): string[] {
  const { data } = useCachedQuery<string[]>(
    ['userCustomMoods', userId],
    async () => {
      const rows = await fetchAllRows((from, to) =>
        supabase.from('books').select('id, custom_moods').eq('user_id', userId!).order('id').range(from, to)
      )
      const counts = new Map<string, { label: string; count: number }>()
      for (const row of rows) {
        for (const mood of row.custom_moods ?? []) {
          const key = mood.trim().toLowerCase()
          if (!key) continue
          const entry = counts.get(key)
          if (entry) entry.count++
          else counts.set(key, { label: mood.trim(), count: 1 })
        }
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
