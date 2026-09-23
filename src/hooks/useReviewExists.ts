import { supabase } from '../lib/supabase'
import { useCachedQuery } from './useCachedQuery'

export function useReviewExists(bookId: string | undefined) {
  const { data: exists, refetch } = useCachedQuery(
    ['reviewExists', bookId],
    async () => {
      const { data } = await supabase.from('reviews').select('id').eq('book_id', bookId!).maybeSingle()
      return Boolean(data)
    },
    false,
    { enabled: !!bookId }
  )

  return { exists, refetch }
}
