import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useReviewExists(bookId: string | undefined) {
  const [exists, setExists] = useState(false)

  useEffect(() => {
    if (!bookId) return
    supabase.from('reviews').select('id').eq('book_id', bookId).maybeSingle()
      .then(({ data }) => setExists(Boolean(data)))
  }, [bookId])

  return { exists }
}