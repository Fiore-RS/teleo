import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database'

type Review = Database['public']['Tables']['reviews']['Row']
type Book = Database['public']['Tables']['books']['Row']
export type ReviewWithBook = Review & { book: Book }

export function useReviews(userId: string | undefined) {
  const [reviews, setReviews] = useState<ReviewWithBook[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!userId) return
    setIsLoading(true)
    const { data } = await supabase
      .from('reviews').select('*, book:books(*)').eq('user_id', userId).order('created_at', { ascending: false })
    setReviews((data ?? []) as ReviewWithBook[])
    setIsLoading(false)
  }, [userId])

  useEffect(() => { refetch() }, [refetch])

  return { reviews, isLoading, refetch }
}