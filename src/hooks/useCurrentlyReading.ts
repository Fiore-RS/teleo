import { supabase } from '../lib/supabase'
import type { Database } from '../types/database'
import { useCachedQuery } from './useCachedQuery'

type Book = Database['public']['Tables']['books']['Row']

const EMPTY: Book[] = []

export function useCurrentlyReading(userId: string | undefined) {
  const { data: books, isLoading, refetch } = useCachedQuery(
    ['currentlyReading', userId],
    async () => {
      const { data } = await supabase
        .from('books')
        .select('*')
        .eq('user_id', userId!)
        .eq('status', 'leyendo')
        .order('created_at', { ascending: false })
      return data ?? []
    },
    EMPTY,
    { enabled: !!userId }
  )

  return { books, isLoading, refetch }
}
