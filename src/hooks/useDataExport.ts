import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { fetchAllRows } from '../lib/fetchAllRows'

/** Versión del formato del respaldo.
 *  - 2: perfil, sagas, libros, etiquetas, reseñas, calificaciones y citas.
 *  - 3 (V.2.0.1): agrega metas, historial de lecturas, días de racha, favoritos del mes y del
 *    año, y lanzamientos. Importar sigue aceptando los respaldos de la versión 2. */
export const EXPORT_VERSION = 3

export function useDataExport(userId: string | undefined) {
  const [isExporting, setIsExporting] = useState(false)

  async function exportData() {
    if (!userId) return false
    setIsExporting(true)

    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      if (profileError) throw profileError

      const [
        sagas,
        books,
        reviews,
        bookTags,
        customRatings,
        favoriteQuotes,
        readingGoals,
        readingHistory,
        readingSessions,
        periodFavorites,
        releases,
      ] = await Promise.all([
        fetchAllRows((from, to) => supabase.from('sagas').select('*').eq('user_id', userId).order('id').range(from, to)),
        fetchAllRows((from, to) => supabase.from('books').select('*').eq('user_id', userId).order('id').range(from, to)),
        fetchAllRows((from, to) => supabase.from('reviews').select('*').eq('user_id', userId).order('id').range(from, to)),
        // Etiquetas, calificaciones y citas no tienen user_id propio: se filtran por el dueño del
        // libro o de la reseña con un join, en vez de mandar cientos de ids en la dirección.
        fetchAllRows((from, to) =>
          supabase
            .from('book_tags')
            .select('book_id, tag, books!inner(user_id)')
            .eq('books.user_id', userId)
            .order('book_id')
            .order('tag')
            .range(from, to)
        ),
        fetchAllRows((from, to) =>
          supabase
            .from('custom_ratings')
            .select('id, review_id, label, icon, value, reviews!inner(user_id)')
            .eq('reviews.user_id', userId)
            .order('id')
            .range(from, to)
        ),
        fetchAllRows((from, to) =>
          supabase
            .from('favorite_quotes')
            .select('id, review_id, quote_text, sort_order, reviews!inner(user_id)')
            .eq('reviews.user_id', userId)
            .order('id')
            .range(from, to)
        ),
        fetchAllRows((from, to) => supabase.from('reading_goals').select('*').eq('user_id', userId).order('id').range(from, to)),
        fetchAllRows((from, to) => supabase.from('reading_history').select('*').eq('user_id', userId).order('id').range(from, to)),
        fetchAllRows((from, to) => supabase.from('reading_sessions').select('*').eq('user_id', userId).order('id').range(from, to)),
        fetchAllRows((from, to) => supabase.from('period_favorites').select('*').eq('user_id', userId).order('id').range(from, to)),
        fetchAllRows((from, to) => supabase.from('releases').select('*').eq('user_id', userId).order('id').range(from, to)),
      ])

      const exportPayload = {
        exportedAt: new Date().toISOString(),
        version: EXPORT_VERSION,
        profile,
        sagas,
        books,
        // Sin el objeto del join, solo los datos propios de cada fila.
        bookTags: bookTags.map(({ book_id, tag }) => ({ book_id, tag })),
        reviews,
        customRatings: customRatings.map(({ id, review_id, label, icon, value }) => ({ id, review_id, label, icon, value })),
        favoriteQuotes: favoriteQuotes.map(({ id, review_id, quote_text, sort_order }) => ({ id, review_id, quote_text, sort_order })),
        readingGoals,
        readingHistory,
        readingSessions,
        periodFavorites,
        releases,
      }

      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `teleo-export-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      return true
    } catch {
      return false
    } finally {
      setIsExporting(false)
    }
  }

  return { exportData, isExporting }
}
