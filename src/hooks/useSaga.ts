import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database'
import { computeMidpointOrder } from '../lib/reorder'
import { recomputeSagaStatus } from '../lib/sagaStatus'
import { useCachedQuery, fieldSetter } from './useCachedQuery'

type Saga = Database['public']['Tables']['sagas']['Row']
type Book = Database['public']['Tables']['books']['Row']

interface SagaDetail {
  saga: Saga | null
  books: Book[]
}

const EMPTY: SagaDetail = { saga: null, books: [] }

export function useSaga(sagaId: string | undefined) {
  const queryClient = useQueryClient()

  const { data, setData, isLoading, refetch } = useCachedQuery<SagaDetail>(
    ['saga', sagaId],
    async () => {
      const [{ data: sagaData }, { data: bookRows }] = await Promise.all([
        supabase.from('sagas').select('*').eq('id', sagaId!).single(),
        supabase.from('books').select('*').eq('saga_id', sagaId!).order('saga_sort_order', { ascending: true }),
      ])
      return { saga: sagaData ?? null, books: bookRows ?? [] }
    },
    EMPTY,
    {
      enabled: !!sagaId,
      // Si la saga (y sus libros) ya están en la caché de El estante, se abre con esos datos
      // al instante mientras se confirma todo con Supabase por detrás.
      placeholder: () => {
        let saga: Saga | undefined
        for (const [, list] of queryClient.getQueriesData<Saga[]>({ queryKey: ['librarySagas'] })) {
          saga = list?.find((s) => s.id === sagaId)
          if (saga) break
        }
        if (!saga) return undefined
        let books: Book[] = []
        for (const [, list] of queryClient.getQueriesData<Book[]>({ queryKey: ['libraryBooks'] })) {
          if (!list) continue
          books = list
            .filter((b) => b.saga_id === sagaId)
            .sort((x, y) => (x.saga_sort_order ?? 0) - (y.saga_sort_order ?? 0))
          break
        }
        return { saga, books }
      },
    }
  )
  const { saga, books } = data
  const setBooks = fieldSetter(setData, 'books')

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
      await recomputeSagaStatus(sagaId)
      await refetch()
    }
    return { error }
  }

  async function removeBookFromSaga(bookId: string) {
    const { error } = await supabase.from('books').update({ saga_id: null }).eq('id', bookId)
    if (!error) {
      setBooks((prev) => prev.filter((b) => b.id !== bookId))
      await recomputeSagaStatus(sagaId)
      await refetch()
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
    if (!error) queryClient.removeQueries({ queryKey: ['saga', sagaId] })
    return !error
  }

  return {
    saga, books, isLoading, refetch, updateSaga,
    assignBookToSaga, removeBookFromSaga, reorderBookInSaga, deleteSaga,
  }
}
