import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database'

type Review = Database['public']['Tables']['reviews']['Row']
type CustomRating = Database['public']['Tables']['custom_ratings']['Row']
type Quote = Database['public']['Tables']['favorite_quotes']['Row']

export function useReview(bookId: string | undefined, userId: string | undefined) {
  const [review, setReview] = useState<Review | null>(null)
  const [customRatings, setCustomRatings] = useState<CustomRating[]>([])
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!bookId) return
    setIsLoading(true)
    const { data: reviewData } = await supabase
      .from('reviews').select('*').eq('book_id', bookId).maybeSingle()

    setReview(reviewData ?? null)

    if (reviewData) {
      const [{ data: ratings }, { data: qs }] = await Promise.all([
        supabase.from('custom_ratings').select('*').eq('review_id', reviewData.id),
        supabase.from('favorite_quotes').select('*').eq('review_id', reviewData.id).order('sort_order', { ascending: true }),
      ])
      setCustomRatings(ratings ?? [])
      setQuotes(qs ?? [])
    } else {
      setCustomRatings([])
      setQuotes([])
    }
    setIsLoading(false)
  }, [bookId])

  useEffect(() => { refetch() }, [refetch])

  async function createReview(initial: Partial<Review>) {
    if (!bookId || !userId) return null
    const { data, error } = await supabase
      .from('reviews').insert({ book_id: bookId, user_id: userId, ...initial }).select().single()
    if (!error && data) { setReview(data); return data }
    return null
  }

  async function updateReview(updates: Partial<Review>) {
    if (!review) return
    const { data, error } = await supabase
      .from('reviews').update(updates).eq('id', review.id).select().single()
    if (!error && data) setReview(data)
  }

  async function deleteReview() {
    if (!review) return false
    const { error } = await supabase.from('reviews').delete().eq('id', review.id)
    if (!error) setReview(null)
    return !error
  }

  async function addCustomRating(rating: { label: string; icon: string; value: number }) {
    if (!review) return
    const { data, error } = await supabase
      .from('custom_ratings').insert({ review_id: review.id, ...rating }).select().single()
    if (!error && data) setCustomRatings((prev) => [...prev, data])
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
    const { data, error } = await supabase
      .from('favorite_quotes').insert({ review_id: review.id, quote_text: quoteText, sort_order: sortOrder }).select().single()
    if (!error && data) setQuotes((prev) => [...prev, data])
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