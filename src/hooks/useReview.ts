import { supabase } from '../lib/supabase'
import type { Database } from '../types/database'
import { useCachedQuery, fieldSetter } from './useCachedQuery'

type Review = Database['public']['Tables']['reviews']['Row']
type CustomRating = Database['public']['Tables']['custom_ratings']['Row']
type Quote = Database['public']['Tables']['favorite_quotes']['Row']

interface ReviewDetail {
  review: Review | null
  customRatings: CustomRating[]
  quotes: Quote[]
}

const EMPTY: ReviewDetail = { review: null, customRatings: [], quotes: [] }

export function useReview(bookId: string | undefined, userId: string | undefined) {
  const { data, setData, isLoading, refetch } = useCachedQuery<ReviewDetail>(
    ['review', bookId],
    async () => {
      const { data: reviewData } = await supabase
        .from('reviews').select('*').eq('book_id', bookId!).maybeSingle()

      if (!reviewData) return { review: null, customRatings: [], quotes: [] }

      const [{ data: ratings }, { data: qs }] = await Promise.all([
        supabase.from('custom_ratings').select('*').eq('review_id', reviewData.id),
        supabase.from('favorite_quotes').select('*').eq('review_id', reviewData.id).order('sort_order', { ascending: true }),
      ])
      return { review: reviewData, customRatings: ratings ?? [], quotes: qs ?? [] }
    },
    EMPTY,
    { enabled: !!bookId }
  )
  const { review, customRatings, quotes } = data
  const setReview = fieldSetter(setData, 'review')
  const setCustomRatings = fieldSetter(setData, 'customRatings')
  const setQuotes = fieldSetter(setData, 'quotes')

  async function createReview(initial: Partial<Review>) {
    if (!bookId || !userId) return null
    const { data: created, error } = await supabase
      .from('reviews').insert({ book_id: bookId, user_id: userId, ...initial }).select().single()
    if (!error && created) { setReview(created); return created }
    return null
  }

  async function updateReview(updates: Partial<Review>) {
    if (!review) return
    const { data: updated, error } = await supabase
      .from('reviews').update(updates).eq('id', review.id).select().single()
    if (!error && updated) setReview(updated)
  }

  async function deleteReview() {
    if (!review) return false
    const { error } = await supabase.from('reviews').delete().eq('id', review.id)
    if (!error) setData(EMPTY)
    return !error
  }

  async function addCustomRating(rating: { label: string; icon: string; value: number }) {
    if (!review) return
    const { data: created, error } = await supabase
      .from('custom_ratings').insert({ review_id: review.id, ...rating }).select().single()
    if (!error && created) setCustomRatings((prev) => [...prev, created])
  }

  async function updateCustomRating(id: string, value: number) {
    await supabase.from('custom_ratings').update({ value }).eq('id', id)
    setCustomRatings((prev) => prev.map((r) => (r.id === id ? { ...r, value } : r)))
  }

  async function removeCustomRating(id: string) {
    await supabase.from('custom_ratings').delete().eq('id', id)
    setCustomRatings((prev) => prev.filter((r) => r.id !== id))
  }

  async function addQuote(quoteText: string) {
    if (!review) return
    const sortOrder = quotes.length
    const { data: created, error } = await supabase
      .from('favorite_quotes').insert({ review_id: review.id, quote_text: quoteText, sort_order: sortOrder }).select().single()
    if (!error && created) setQuotes((prev) => [...prev, created])
  }

  async function removeQuote(id: string) {
    await supabase.from('favorite_quotes').delete().eq('id', id)
    setQuotes((prev) => prev.filter((q) => q.id !== id))
  }

  return {
    review, customRatings, quotes, isLoading, refetch,
    createReview, updateReview, deleteReview,
    addCustomRating, updateCustomRating, removeCustomRating,
    addQuote, removeQuote,
  }
}
