import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database'
import { recomputeSagaStatus } from '../lib/sagaStatus'
import { useCachedQuery } from './useCachedQuery'

type Book = Database['public']['Tables']['books']['Row']

interface BookDetail {
  book: Book | null
  tags: string[]
}

const EMPTY: BookDetail = { book: null, tags: [] }

export function useBook(bookId: string | undefined) {
  const queryClient = useQueryClient()

  const { data, isLoading, refetch } = useCachedQuery<BookDetail>(
    ['book', bookId],
    async () => {
      const [{ data: bookData }, { data: tagRows }] = await Promise.all([
        supabase.from('books').select('*').eq('id', bookId!).single(),
        supabase.from('book_tags').select('tag').eq('book_id', bookId!),
      ])
      return { book: bookData ?? null, tags: (tagRows ?? []).map((t) => t.tag) }
    },
    EMPTY,
    {
      enabled: !!bookId,
      // Si el libro ya está en la caché de alguna lista (El estante, La mesa...), se abre su
      // detalle con esos datos al instante; las etiquetas llegan un momento después.
      placeholder: () => {
        for (const [, list] of queryClient.getQueriesData<Book[]>({ queryKey: ['libraryBooks'] })) {
          const found = list?.find((b) => b.id === bookId)
          if (found) return { book: found, tags: [] }
        }
        return undefined
      },
    }
  )
  const { book, tags } = data

  async function updateBook(updates: Partial<Book>) {
    if (!bookId) return
    await supabase.from('books').update(updates).eq('id', bookId)
    // El estado de la saga se recalcula solo cuando cambia el status del libro (es lo único
    // que afecta el cálculo) y el libro pertenece a una saga.
    if ('status' in updates && book?.saga_id) {
      await recomputeSagaStatus(book.saga_id)
    }
    await refetch()
  }

  async function addTag(tag: string) {
    if (!bookId) return
    await supabase.from('book_tags').insert({ book_id: bookId, tag })
    await refetch()
  }

  async function removeTag(tag: string) {
    if (!bookId) return
    await supabase.from('book_tags').delete().eq('book_id', bookId).eq('tag', tag)
    await refetch()
  }

  async function deleteBook() {
    if (!bookId) return false
    const sagaId = book?.saga_id
    const { error } = await supabase.from('books').delete().eq('id', bookId)
    if (!error && sagaId) {
      await recomputeSagaStatus(sagaId)
    }
    if (!error) queryClient.removeQueries({ queryKey: ['book', bookId] })
    return !error
  }

  return { book, tags, isLoading, refetch, updateBook, addTag, removeTag, deleteBook }
}
