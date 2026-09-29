import { supabase } from '../lib/supabase'
import type { Database } from '../types/database'
import { useCachedQuery } from './useCachedQuery'
import { isReviewWritten, REVIEW_CONTENT_COLUMNS, type ReviewContent } from '../lib/reviews'

type Book = Database['public']['Tables']['books']['Row']

const EMPTY: Book[] = []

export function useReviewableBooks(userId: string | undefined) {
  const { data: books, isLoading, refetch } = useCachedQuery(
    ['reviewableBooks', userId],
    async () => {
      const { data: terminados } = await supabase
        .from('books').select('*').eq('user_id', userId!).eq('status', 'terminado')
      const { data: reviewed } = await supabase
        .from('reviews').select(`book_id, ${REVIEW_CONTENT_COLUMNS}`).eq('user_id', userId!)

      // Los libros que solo tienen citas anotadas (reseña borrador) siguen apareciendo.
      const reviewedIds = new Set(
        ((reviewed ?? []) as (ReviewContent & { book_id: string })[]).filter(isReviewWritten).map((r) => r.book_id)
      )
      return (terminados ?? []).filter((b: Book) => !reviewedIds.has(b.id))
    },
    EMPTY,
    { enabled: !!userId }
  )

  return { books, isLoading, refetch }
}
