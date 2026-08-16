import { useState } from 'react'
import { supabase } from '../lib/supabase'

export function useDataExport(userId: string | undefined) {
  const [isExporting, setIsExporting] = useState(false)

  async function exportData() {
    if (!userId) return false
    setIsExporting(true)

    const [{ data: profile }, { data: sagas }, { data: books }, { data: reviews }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('sagas').select('*').eq('user_id', userId),
      supabase.from('books').select('*').eq('user_id', userId),
      supabase.from('reviews').select('*').eq('user_id', userId),
    ])

    const bookIds = (books ?? []).map((b) => b.id)
    const reviewIds = (reviews ?? []).map((r) => r.id)

    const [{ data: bookTags }, { data: customRatings }, { data: favoriteQuotes }] = await Promise.all([
      bookIds.length > 0
        ? supabase.from('book_tags').select('*').in('book_id', bookIds)
        : Promise.resolve({ data: [] }),
      reviewIds.length > 0
        ? supabase.from('custom_ratings').select('*').in('review_id', reviewIds)
        : Promise.resolve({ data: [] }),
      reviewIds.length > 0
        ? supabase.from('favorite_quotes').select('*').in('review_id', reviewIds)
        : Promise.resolve({ data: [] }),
    ])

    const exportPayload = {
      exportedAt: new Date().toISOString(),
      version: 2,
      profile,
      sagas: sagas ?? [],
      books: books ?? [],
      bookTags: bookTags ?? [],
      reviews: reviews ?? [],
      customRatings: customRatings ?? [],
      favoriteQuotes: favoriteQuotes ?? [],
    }

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `teleo-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)

    setIsExporting(false)
    return true
  }

  return { exportData, isExporting }
}