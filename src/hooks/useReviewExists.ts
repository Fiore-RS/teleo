import { supabase } from '../lib/supabase'
import { useCachedQuery } from './useCachedQuery'
import { isReviewWritten, REVIEW_CONTENT_COLUMNS, type ReviewContent } from '../lib/reviews'

export function useReviewExists(bookId: string | undefined) {
  const { data: exists, refetch } = useCachedQuery(
    ['reviewExists', bookId],
    async () => {
      // Solo cuenta una reseña escrita: si el libro solo tiene citas anotadas (borrador), se
      // sigue ofreciendo "Crear reseña de lectura".
      const { data } = await supabase.from('reviews').select(REVIEW_CONTENT_COLUMNS).eq('book_id', bookId!).maybeSingle()
      return isReviewWritten(data as ReviewContent | null)
    },
    false,
    { enabled: !!bookId }
  )

  return { exists, refetch }
}
