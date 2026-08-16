import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useReviewExists(bookId: string | undefined) {
  const [exists, setExists] = useState(false)

  const refetch = useCallback(async () => {
    if (!bookId) return
    const { data } = await supabase.from('reviews').select('id').eq('book_id', bookId).maybeSingle()
    setExists(Boolean(data))
  }, [bookId])

  useEffect(() => { refetch() }, [refetch])

  return { exists, refetch }
}