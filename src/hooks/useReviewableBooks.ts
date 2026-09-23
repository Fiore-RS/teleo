import { supabase } from '../lib/supabase'
import type { Database } from '../types/database'
import { useCachedQuery } from './useCachedQuery'

type Book = Database['public']['Tables']['books']['Row']

const EMPTY: Book[] = []

export function useReviewableBooks(userId: string | undefined) {
  const { data: books, isLoading, refetch } = useCachedQuery(
    ['reviewableBooks', userId],
    async () => {
      const { data: terminados } = await supabase
        .from('books').select('*').eq('user_id', userId!).eq('status', 'terminado')
      const { data: reviewed } = await supabase
        .from('reviews').select('book_id').eq('user_id', userId!)

      const reviewedIds = new Set((reviewed ?? []).map((r: { book_id: string }) => r.book_id))
      return (terminados ?? []).filter((b: Book) => !reviewedIds.has(b.id))
    },
    EMPTY,
    { enabled: !!userId }
  )

  return { books, isLoading, refetch }
}
