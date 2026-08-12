import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database'
import { computeMidpointOrder } from '../lib/reorder'

type Book = Database['public']['Tables']['books']['Row']

export function useLibraryBooks(userId: string | undefined) {
  const [books, setBooks] = useState<Book[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!userId) return
    setIsLoading(true)
    const { data } = await supabase
      .from('books')
      .select('*')
      .eq('user_id', userId)
      .order('estante_sort_order', { ascending: true })
    setBooks(data ?? [])
    setIsLoading(false)
  }, [userId])

  useEffect(() => {
    refetch()
  }, [refetch])

  async function addBook(book: Omit<Database['public']['Tables']['books']['Insert'], 'user_id'>) {
    if (!userId) return { error: new Error('No hay usuario') }
    const maxOrder = books.length > 0 ? Math.max(...books.map((b) => b.estante_sort_order ?? 0)) : 0
    const { data, error } = await supabase
      .from('books')
      .insert({ ...book, user_id: userId, estante_sort_order: maxOrder + 1000 })
      .select()
      .single()

    if (!error && data) {
      setBooks((prev) => [...prev, data])
    }
    return { data, error }
  }

  // beforeId/afterId son los vecinos INMEDIATOS visibles en la lista filtrada actual
  async function reorderBook(bookId: string, beforeId: string | null, afterId: string | null) {
    const beforeOrder = beforeId ? books.find((b) => b.id === beforeId)?.estante_sort_order ?? null : null
    const afterOrder = afterId ? books.find((b) => b.id === afterId)?.estante_sort_order ?? null : null
    const newOrder = computeMidpointOrder(beforeOrder, afterOrder)

    setBooks((prev) =>
      prev
        .map((b) => (b.id === bookId ? { ...b, estante_sort_order: newOrder } : b))
        .sort((a, b) => (a.estante_sort_order ?? 0) - (b.estante_sort_order ?? 0))
    )

    await supabase.from('books').update({ estante_sort_order: newOrder }).eq('id', bookId)
  }

  return { books, isLoading, refetch, addBook, reorderBook }
}