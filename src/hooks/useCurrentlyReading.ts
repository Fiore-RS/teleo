import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database'

type Book = Database['public']['Tables']['books']['Row']

export function useCurrentlyReading(userId: string | undefined) {
  const [books, setBooks] = useState<Book[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!userId) return
    setIsLoading(true)
    const { data } = await supabase
      .from('books')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'leyendo')
      .order('created_at', { ascending: false })
    setBooks(data ?? [])
    setIsLoading(false)
  }, [userId])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { books, isLoading, refetch }
}