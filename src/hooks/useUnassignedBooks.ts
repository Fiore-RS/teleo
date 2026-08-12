import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database'

type Book = Database['public']['Tables']['books']['Row']

export function useUnassignedBooks(userId: string | undefined) {
  const [books, setBooks] = useState<Book[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!userId) return
    setIsLoading(true)
    const { data } = await supabase
      .from('books')
      .select('*')
      .eq('user_id', userId)
      .is('saga_id', null)
      .order('title', { ascending: true })
    setBooks(data ?? [])
    setIsLoading(false)
  }, [userId])

  useEffect(() => { refetch() }, [refetch])

  return { books, isLoading, refetch }
}