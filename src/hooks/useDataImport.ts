import { useState } from 'react'
import { supabase } from '../lib/supabase'

export function useDataImport(userId: string | undefined) {
  const [isImporting, setIsImporting] = useState(false)

  async function importData(file: File) {
    if (!userId) return false
    setIsImporting(true)
    try {
      const text = await file.text()
      const parsed = JSON.parse(text)

      if (Array.isArray(parsed.sagas) && parsed.sagas.length > 0) {
        await supabase.from('sagas').insert(
          parsed.sagas.map((s: Record<string, unknown>) => ({
            user_id: userId, title: s.title, author: s.author,
            category: s.category, status: s.status, is_favorite: s.is_favorite,
          }))
        )
      }
      if (Array.isArray(parsed.books) && parsed.books.length > 0) {
        await supabase.from('books').insert(
          parsed.books.map((b: Record<string, unknown>) => ({
            user_id: userId, title: b.title, author: b.author, cover_url: b.cover_url,
            format: b.format, language: b.language, category: b.category, status: b.status,
            is_favorite: b.is_favorite, isbn: b.isbn, total_pages: b.total_pages,
          }))
        )
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