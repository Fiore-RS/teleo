import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database'
import { computeMidpointOrder } from '../lib/reorder'

type Saga = Database['public']['Tables']['sagas']['Row']
type Book = Database['public']['Tables']['books']['Row']

export function useSaga(sagaId: string | undefined) {
  const [saga, setSaga] = useState<Saga | null>(null)
  const [books, setBooks] = useState<Book[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!sagaId) return
    setIsLoading(true)
    const [{ data: sagaData }, { data: bookRows }] = await Promise.all([
      supabase.from('sagas').select('*').eq('id', sagaId).single(),
      supabase.from('books').select('*').eq('saga_id', sagaId).order('saga_sort_order', { ascending: true }),
    ])
    setSaga(sagaData ?? null)
    setBooks(bookRows ?? [])
    setIsLoading(false)
  }, [sagaId])

  useEffect(() => { refetch() }, [refetch])

  async function updateSaga(updates: Partial<Saga>) {
    if (!sagaId) return
    await supabase.from('sagas').update(updates).eq('id', sagaId)
    await refetch()
  }

  async function assignBookToSaga(book: Book) {
    const maxOrder = books.length > 0 ? Math.max(...books.map((b) => b.saga_sort_order ?? 0)) : 0
    const newOrder = maxOrder + 1000
    const { error } = await supabase
      .from('books')
      .update({ saga_id: sagaId, saga_sort_order: newOrder })
      .eq('id', book.id)
    if (!error) {
      setBooks((prev) => [...prev, { ...book, saga_id: sagaId ?? null, saga_sort_order: newOrder }])
    }
    return { error }
  }

  async function removeBookFromSaga(bookId: string) {
    const { error } = await supabase.from('books').update({ saga_id: null }).eq('id', bookId)
    if (!error) {
      setBooks((prev) => prev.filter((b) => b.id !== bookId))
    }
  }

  async function reorderBookInSaga(bookId: string, beforeId: string | null, afterId: string | null) {
    const beforeOrder = beforeId ? books.find((b) => b.id === beforeId)?.saga_sort_order ?? null : null
    const afterOrder = afterId ? books.find((b) => b.id === afterId)?.saga_sort_order ?? null : null
    const newOrder = computeMidpointOrder(beforeOrder, afterOrder)

    setBooks((prev) =>
      prev
        .map((b) => (b.id === bookId ? { ...b, saga_sort_order: newOrder } : b))
        .sort((a, b) => (a.saga_sort_order ?? 0) - (b.saga_sort_order ?? 0))
    )

    await supabase.from('books').update({ saga_sort_order: newOrder }).eq('id', bookId)
  }

  async function deleteSaga() {
    if (!sagaId) return false
    const { error } = await supabase.from('sagas').delete().eq('id', sagaId)
    return !error
  }

  return {
    saga, books, isLoading, refetch, updateSaga,
    assignBookToSaga, removeBookFromSaga, reorderBookInSaga, deleteSaga,
  }
}