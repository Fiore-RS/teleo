import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database'
import { computeMidpointOrder } from '../lib/reorder'

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
      .from('reviews')
      .select('*, book:books(*)')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })

    const rows = (data ?? []) as ReviewWithBook[]

    // Auto-reparación: reseñas creadas antes de este campo (0019_reviews_sort_order.sql)
    // pueden haber quedado con sort_order null hasta que se aplique la migración — mismo
    // patrón que ya usan useLibraryBooks/useLibrarySagas para estante_sort_order.
    const missingOrder = rows.filter((r) => r.sort_order === null)
    if (missingOrder.length > 0) {
      let nextOrder = rows.reduce((max, r) => Math.max(max, r.sort_order ?? 0), 0) + 1000
      for (const review of missingOrder) {
        review.sort_order = nextOrder
        await supabase.from('reviews').update({ sort_order: nextOrder }).eq('id', review.id)
        nextOrder += 1000
      }
    }

    setReviews(rows)
    setIsLoading(false)
  }, [userId])

  useEffect(() => { refetch() }, [refetch])

  // beforeId/afterId son los vecinos INMEDIATOS visibles en la lista filtrada actual, igual
  // que reorderBook/reorderSaga en Estante.
  async function reorderReview(reviewId: string, beforeId: string | null, afterId: string | null) {
    const beforeOrder = beforeId ? reviews.find((r) => r.id === beforeId)?.sort_order ?? null : null
    const afterOrder = afterId ? reviews.find((r) => r.id === afterId)?.sort_order ?? null : null
    const newOrder = computeMidpointOrder(beforeOrder, afterOrder)

    setReviews((prev) =>
      prev
        .map((r) => (r.id === reviewId ? { ...r, sort_order: newOrder } : r))
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    )

    await supabase.from('reviews').update({ sort_order: newOrder }).eq('id', reviewId)
  }

  return { reviews, isLoading, refetch, reorderReview }
}