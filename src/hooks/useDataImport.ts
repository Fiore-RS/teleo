import { useState } from 'react'
import { supabase } from '../lib/supabase'

interface ExportedSaga {
  id: string; title: string; author: string | null; category: string | null
  status: string | null; is_favorite: boolean | null
}
interface ExportedBook {
  id: string; saga_id: string | null; title: string; author: string | null
  cover_url: string | null; format: string | null; language: string | null
  category: string | null; status: string; is_favorite: boolean | null
  isbn: string | null; total_pages: number | null; current_page: number | null
  total_duration_seconds: number | null; current_duration_seconds: number | null
  start_date: string | null; end_date: string | null; abandon_reason: string | null
}
interface ExportedBookTag { book_id: string; tag: string }
interface ExportedReview {
  id: string; book_id: string; general_rating: number | null
  general_comments: string | null; recommends: boolean | null
  favorite_character_name: string | null; favorite_character_notes: string | null
  favorite_character_photo_url: string | null
}
interface ExportedCustomRating { review_id: string; label: string; icon: string; value: number | null }
interface ExportedQuote { review_id: string; quote_text: string; sort_order: number | null }

interface ExportPayload {
  version?: number
  sagas?: ExportedSaga[]
  books?: ExportedBook[]
  bookTags?: ExportedBookTag[]
  reviews?: ExportedReview[]
  customRatings?: ExportedCustomRating[]
  favoriteQuotes?: ExportedQuote[]
}

export function useDataImport(userId: string | undefined) {
  const [isImporting, setIsImporting] = useState(false)

  async function importData(file: File) {
    if (!userId) return false
    setIsImporting(true)

    try {
      const text = await file.text()
      const parsed: ExportPayload = JSON.parse(text)

      // 1. Sagas primero, para poder remapear saga_id en los libros
      const sagaIdMap = new Map<string, string>()
      const importedSagas = parsed.sagas ?? []
      if (importedSagas.length > 0) {
        const rows = importedSagas.map((s) => ({
          user_id: userId, title: s.title, author: s.author,
          category: s.category, status: s.status, is_favorite: s.is_favorite ?? false,
        }))
        const { data: inserted, error } = await supabase.from('sagas').insert(rows).select('id')
        if (error) throw error
        inserted?.forEach((row, i) => sagaIdMap.set(importedSagas[i].id, row.id))
      }

      // 2. Libros, remapeando saga_id
      const bookIdMap = new Map<string, string>()
      const importedBooks = parsed.books ?? []
      if (importedBooks.length > 0) {
        const rows = importedBooks.map((b) => ({
          user_id: userId,
          saga_id: b.saga_id ? sagaIdMap.get(b.saga_id) ?? null : null,
          title: b.title, author: b.author, cover_url: b.cover_url,
          format: b.format, language: b.language, category: b.category, status: b.status,
          is_favorite: b.is_favorite ?? false, isbn: b.isbn,
          total_pages: b.total_pages, current_page: b.current_page,
          total_duration_seconds: b.total_duration_seconds, current_duration_seconds: b.current_duration_seconds,
          start_date: b.start_date, end_date: b.end_date, abandon_reason: b.abandon_reason,
        }))
        const { data: inserted, error } = await supabase.from('books').insert(rows).select('id')
        if (error) throw error
        inserted?.forEach((row, i) => bookIdMap.set(importedBooks[i].id, row.id))
      }

      // 3. Etiquetas, remapeando book_id
      const importedTags = (parsed.bookTags ?? []).filter((t) => bookIdMap.has(t.book_id))
      if (importedTags.length > 0) {
        const rows = importedTags.map((t) => ({ book_id: bookIdMap.get(t.book_id)!, tag: t.tag }))
        await supabase.from('book_tags').insert(rows)
      }

      // 4. Reseñas, remapeando book_id (solo si el libro correspondiente se importó)
      const reviewIdMap = new Map<string, string>()
      const importedReviews = (parsed.reviews ?? []).filter((r) => bookIdMap.has(r.book_id))
      if (importedReviews.length > 0) {
        const rows = importedReviews.map((r) => ({
          user_id: userId, book_id: bookIdMap.get(r.book_id)!,
          general_rating: r.general_rating, general_comments: r.general_comments,
          recommends: r.recommends, favorite_character_name: r.favorite_character_name,
          favorite_character_notes: r.favorite_character_notes,
          favorite_character_photo_url: r.favorite_character_photo_url,
        }))
        const { data: inserted, error } = await supabase.from('reviews').insert(rows).select('id')
        if (error) throw error
        inserted?.forEach((row, i) => reviewIdMap.set(importedReviews[i].id, row.id))
      }

      // 5. Calificaciones personalizadas, remapeando review_id
      const importedRatings = (parsed.customRatings ?? []).filter((cr) => reviewIdMap.has(cr.review_id))
      if (importedRatings.length > 0) {
        const rows = importedRatings.map((cr) => ({
          review_id: reviewIdMap.get(cr.review_id)!, label: cr.label, icon: cr.icon, value: cr.value,
        }))
        await supabase.from('custom_ratings').insert(rows)
      }

      // 6. Citas favoritas, remapeando review_id
      const importedQuotes = (parsed.favoriteQuotes ?? []).filter((q) => reviewIdMap.has(q.review_id))
      if (importedQuotes.length > 0) {
        const rows = importedQuotes.map((q) => ({
          review_id: reviewIdMap.get(q.review_id)!, quote_text: q.quote_text, sort_order: q.sort_order ?? 0,
        }))
        await supabase.from('favorite_quotes').insert(rows)
      }

      setIsImporting(false)
      return true
    } catch {
      setIsImporting(false)
      return false
    }
  }

  return { importData, isImporting }
}