import { supabase } from '../lib/supabase'
import type { Database } from '../types/database'
import { useCachedQuery } from './useCachedQuery'

type Book = Database['public']['Tables']['books']['Row']

const EMPTY: Book[] = []

export function useUnassignedBooks(userId: string | undefined) {
  const { data: books, isLoading, refetch } = useCachedQuery(
    ['unassignedBooks', userId],
    async () => {
      const { data } = await supabase
        .from('books')
        .select('*')
        .eq('user_id', userId!)
        .is('saga_id', null)
        .order('title', { ascending: true })
      return data ?? []
    },
    EMPTY,
    { enabled: !!userId }
  )

  return { books, isLoading, refetch }
}
