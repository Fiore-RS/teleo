import { supabase } from '../lib/supabase'
import { queryClient } from '../lib/queryClient'
import type { Database } from '../types/database'
import { useCachedQuery } from './useCachedQuery'
import { computeMidpointOrder } from '../lib/reorder'
import { topQuoteOrder } from '../lib/quoteOrder'

type QuoteRow = Database['public']['Tables']['favorite_quotes']['Row']
type Book = Database['public']['Tables']['books']['Row']

export type QuoteBook = Pick<Book, 'id' | 'title' | 'author' | 'cover_url' | 'status'>
export type QuoteWithBook = QuoteRow & { book: QuoteBook }

interface QueryRow extends QuoteRow {
  review: { user_id: string; book: QuoteBook | null } | null
}

const EMPTY: QuoteWithBook[] = []

/** Todas las citas de la persona, de todas sus reseñas (Mis citas, V.2.1.0), de la más
 *  reciente a la más antigua. Las citas siguen colgando de una reseña: agregar una cita a un
 *  libro sin reseña crea primero una reseña vacía para ese libro. */
export function useQuotes(userId: string | undefined) {
  const { data: quotes, setData: setQuotes, isLoading, refetch } = useCachedQuery<QuoteWithBook[]>(
    ['quotes', userId],
    async () => {
      const { data } = await supabase
        .from('favorite_quotes')
        .select('*, review:reviews!inner(user_id, book:books(id, title, author, cover_url, status))')
        .eq('review.user_id', userId!)
        .order('created_at', { ascending: false })
        .order('sort_order', { ascending: true })

      return ((data ?? []) as unknown as QueryRow[])
        .filter((row) => row.review?.book)
        .map(({ review, ...quote }) => ({ ...quote, book: review!.book! }))
    },
    EMPTY,
    { enabled: !!userId }
  )

  /** Agrega una cita al libro. Devuelve false si algo falló. */
  async function addQuote(book: QuoteBook, quoteText: string, page: number | null) {
    if (!userId) return false
    const { data: existing, error: findError } = await supabase.from('reviews').select('id').eq('book_id', book.id).maybeSingle()
    if (findError) {
      console.error('[useQuotes] No se pudo buscar la reseña:', findError)
      return false
    }
    let reviewId = existing?.id
    if (!reviewId) {
      const { data: created, error } = await supabase
        .from('reviews').insert({ book_id: book.id, user_id: userId }).select('id').single()
      if (error || !created) {
        console.error('[useQuotes] No se pudo crear la reseña borrador:', error)
        return false
      }
      reviewId = created.id
    }

    const { count } = await supabase
      .from('favorite_quotes').select('id', { count: 'exact', head: true }).eq('review_id', reviewId)
    // Una cita nueva va arriba del orden libre de Citas (V.3.1.0).
    const cuadernoOrder = await topQuoteOrder(userId)
    const { data: quote, error } = await supabase
      .from('favorite_quotes')
      .insert({ review_id: reviewId, quote_text: quoteText, page, sort_order: count ?? 0, cuaderno_sort_order: cuadernoOrder })
      .select()
      .single()
    if (error || !quote) {
      console.error('[useQuotes] No se pudo guardar la cita:', error)
      return false
    }

    setQuotes((prev) => [{ ...quote, book }, ...prev])
    // La reseña del libro (y Cuaderno, si se creó una) tiene que enterarse de la cita nueva.
    queryClient.invalidateQueries({ queryKey: ['review', book.id] })
    if (!existing) {
      queryClient.invalidateQueries({ queryKey: ['reviews', userId] })
      queryClient.invalidateQueries({ queryKey: ['reviewableBooks', userId] })
    }
    return true
  }

  /** Cambia el texto o la página de una cita (desde Mis citas, V.2.1.1). Devuelve false si
   *  algo falló. */
  async function updateQuote(quote: QuoteWithBook, quoteText: string, page: number | null) {
    const { error } = await supabase.from('favorite_quotes').update({ quote_text: quoteText, page }).eq('id', quote.id)
    if (error) {
      console.error('[useQuotes] No se pudo editar la cita:', error)
      return false
    }
    setQuotes((prev) => prev.map((q) => (q.id === quote.id ? { ...q, quote_text: quoteText, page } : q)))
    queryClient.invalidateQueries({ queryKey: ['review', quote.book.id] })
    return true
  }

  async function removeQuote(quote: QuoteWithBook) {
    const { error } = await supabase.from('favorite_quotes').delete().eq('id', quote.id)
    if (error) return false
    setQuotes((prev) => prev.filter((q) => q.id !== quote.id))
    queryClient.invalidateQueries({ queryKey: ['review', quote.book.id] })
    return true
  }

  /** Mueve una cita en el orden libre de Citas (V.3.1.0): queda entre las de `beforeId` y
   *  `afterId`, con el mismo cálculo por punto medio que Estante y Reseñas. */
  async function reorderQuote(quoteId: string, beforeId: string | null, afterId: string | null) {
    const orderOf = (id: string | null) => (id ? quotes.find((q) => q.id === id)?.cuaderno_sort_order ?? null : null)
    const newOrder = computeMidpointOrder(orderOf(beforeId), orderOf(afterId))
    setQuotes((prev) => prev.map((q) => (q.id === quoteId ? { ...q, cuaderno_sort_order: newOrder } : q)))
    await supabase.from('favorite_quotes').update({ cuaderno_sort_order: newOrder }).eq('id', quoteId)
  }

  return { quotes, isLoading, refetch, addQuote, updateQuote, removeQuote, reorderQuote }
}
