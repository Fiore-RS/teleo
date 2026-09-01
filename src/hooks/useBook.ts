import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database'
import { recomputeSagaStatus } from '../lib/sagaStatus'

type Book = Database['public']['Tables']['books']['Row']

export function useBook(bookId: string | undefined) {
  const [book, setBook] = useState<Book | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const refetch = useCallback(async (silent = false) => {
    if (!bookId) return
    if (!silent) setIsLoading(true)
    const [{ data: bookData }, { data: tagRows }] = await Promise.all([
      supabase.from('books').select('*').eq('id', bookId).single(),
      supabase.from('book_tags').select('tag').eq('book_id', bookId),
    ])
    setBook(bookData ?? null)
    setTags((tagRows ?? []).map((t) => t.tag))
    if (!silent) setIsLoading(false)
  }, [bookId])

  useEffect(() => { refetch() }, [refetch])

  async function updateBook(updates: Partial<Book>) {
    if (!bookId) return
    await supabase.from('books').update(updates).eq('id', bookId)
    // El estado de la saga se recalcula solo cuando cambia el status del libro (es lo único
    // que afecta el cálculo) y el libro pertenece a una saga.
    if ('status' in updates && book?.saga_id) {
      await recomputeSagaStatus(book.saga_id)
    }
    await refetch(true)
  }

  async function addTag(tag: string) {
    if (!bookId) return
    await supabase.from('book_tags').insert({ book_id: bookId, tag })
    await refetch(true)
  }

  async function removeTag(tag: string) {
    if (!bookId) return
    await supabase.from('book_tags').delete().eq('book_id', bookId).eq('tag', tag)
    await refetch(true)
  }

  async function deleteBook() {
    if (!bookId) return false
    const sagaId = book?.saga_id
    const { error } = await supabase.from('books').delete().eq('id', bookId)
    if (!error && sagaId) {
      await recomputeSagaStatus(sagaId)
    }
    return !error
  }

  return { book, tags, isLoading, refetch, updateBook, addTag, removeTag, deleteBook }
} 
