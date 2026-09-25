import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { fetchAllRows } from '../lib/fetchAllRows'
import { queryClient } from '../lib/queryClient'
import type { Tables } from '../types/database'

/* Los respaldos pueden venir de cualquier versión del formato (ver EXPORT_VERSION en
 * useDataExport.ts), así que todos los campos se leen como opcionales: un respaldo viejo
 * simplemente no trae los campos nuevos y se usan los valores por defecto. */
type Backup<T extends keyof ImportableTables> = Partial<ImportableTables[T]>
interface ImportableTables {
  sagas: Tables<'sagas'>
  books: Tables<'books'>
  book_tags: Tables<'book_tags'>
  reviews: Tables<'reviews'>
  custom_ratings: Tables<'custom_ratings'>
  favorite_quotes: Tables<'favorite_quotes'>
  reading_goals: Tables<'reading_goals'>
  reading_history: Tables<'reading_history'>
  reading_sessions: Tables<'reading_sessions'>
  period_favorites: Tables<'period_favorites'>
  releases: Tables<'releases'>
  profiles: Tables<'profiles'>
}

interface ExportPayload {
  version?: number
  profile?: Backup<'profiles'> | null
  sagas?: Backup<'sagas'>[]
  books?: Backup<'books'>[]
  bookTags?: Backup<'book_tags'>[]
  reviews?: Backup<'reviews'>[]
  customRatings?: Backup<'custom_ratings'>[]
  favoriteQuotes?: Backup<'favorite_quotes'>[]
  // Desde la versión 3 del respaldo (V.2.0.1):
  readingGoals?: Backup<'reading_goals'>[]
  readingHistory?: Backup<'reading_history'>[]
  readingSessions?: Backup<'reading_sessions'>[]
  periodFavorites?: Backup<'period_favorites'>[]
  releases?: Backup<'releases'>[]
}

/** Tamaño de cada tanda al insertar, para no mandar miles de filas en un solo pedido. */
const CHUNK_SIZE = 500

/** Inserta filas por tandas y devuelve los ids nuevos en el mismo orden en que se mandaron,
 *  para poder remapear los ids viejos del respaldo a los nuevos. */
async function insertReturningIds(
  table: 'sagas' | 'books' | 'reviews',
  rows: Record<string, unknown>[]
): Promise<string[]> {
  const ids: string[] = []
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const { data, error } = await supabase
      .from(table)
      // El tipo exacto de cada tabla ya se arma al construir `rows`.
      .insert(rows.slice(i, i + CHUNK_SIZE) as never)
      .select('id')
    if (error) throw error
    ids.push(...(data ?? []).map((row) => row.id))
  }
  return ids
}

/** Inserta filas por tandas, sin necesitar lo que devuelve la base. */
async function insertAll(
  table: 'book_tags' | 'custom_ratings' | 'favorite_quotes' | 'reading_goals' | 'reading_history' | 'reading_sessions' | 'period_favorites' | 'releases',
  rows: Record<string, unknown>[]
) {
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const { error } = await supabase.from(table).insert(rows.slice(i, i + CHUNK_SIZE) as never)
    if (error) throw error
  }
}

/** Solo copia la fecha de creación si el respaldo la trae; si no, la base pone la de hoy. */
function withCreatedAt(createdAt: string | null | undefined) {
  return createdAt ? { created_at: createdAt } : {}
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
      const importedSagas = (parsed.sagas ?? []).filter((s) => s.id && s.title)
      if (importedSagas.length > 0) {
        const rows = importedSagas.map((s, i) => ({
          user_id: userId,
          title: s.title,
          author: s.author ?? null,
          category: s.category ?? null,
          status: s.status ?? null,
          is_favorite: s.is_favorite ?? false,
          total_books: s.total_books ?? null,
          estante_sort_order: s.estante_sort_order ?? (i + 1) * 1000,
          ...withCreatedAt(s.created_at),
        }))
        const ids = await insertReturningIds('sagas', rows)
        ids.forEach((id, i) => sagaIdMap.set(importedSagas[i].id!, id))
      }

      // 2. Libros, remapeando saga_id. Se copian todos los campos del libro, incluidos los que
      //    se agregaron después del primer formato (precio, fecha de compra, progreso en %,
      //    lista de temporada y el orden dentro de la saga).
      const bookIdMap = new Map<string, string>()
      const importedBooks = (parsed.books ?? []).filter((b) => b.id && b.title && b.status)
      if (importedBooks.length > 0) {
        const rows = importedBooks.map((b, i) => ({
          user_id: userId,
          saga_id: b.saga_id ? sagaIdMap.get(b.saga_id) ?? null : null,
          title: b.title,
          author: b.author ?? null,
          cover_url: b.cover_url ?? null,
          format: b.format ?? null,
          language: b.language ?? null,
          category: b.category ?? null,
          status: b.status,
          is_favorite: b.is_favorite ?? false,
          isbn: b.isbn ?? null,
          total_pages: b.total_pages ?? null,
          current_page: b.current_page ?? null,
          progress_percent: b.progress_percent ?? null,
          total_duration_seconds: b.total_duration_seconds ?? null,
          current_duration_seconds: b.current_duration_seconds ?? null,
          start_date: b.start_date ?? null,
          end_date: b.end_date ?? null,
          abandon_reason: b.abandon_reason ?? null,
          price: b.price ?? null,
          purchase_date: b.purchase_date ?? null,
          is_gift: b.is_gift ?? false,
          gift_from: b.gift_from ?? null,
          is_priority: b.is_priority ?? false,
          priority_sort_order: b.priority_sort_order ?? null,
          saga_sort_order: b.saga_sort_order ?? null,
          estante_sort_order: b.estante_sort_order ?? (i + 1) * 1000,
          ...withCreatedAt(b.created_at),
        }))
        const ids = await insertReturningIds('books', rows)
        ids.forEach((id, i) => bookIdMap.set(importedBooks[i].id!, id))
      }

      // 3. Etiquetas, remapeando book_id
      const importedTags = (parsed.bookTags ?? []).filter((t) => t.book_id && t.tag && bookIdMap.has(t.book_id))
      await insertAll(
        'book_tags',
        importedTags.map((t) => ({ book_id: bookIdMap.get(t.book_id!)!, tag: t.tag }))
      )

      // 4. Reseñas, remapeando book_id (solo si el libro correspondiente se importó)
      const reviewIdMap = new Map<string, string>()
      const importedReviews = (parsed.reviews ?? []).filter((r) => r.id && r.book_id && bookIdMap.has(r.book_id))
      if (importedReviews.length > 0) {
        const rows = importedReviews.map((r) => ({
          user_id: userId,
          book_id: bookIdMap.get(r.book_id!)!,
          general_rating: r.general_rating ?? null,
          general_comments: r.general_comments ?? null,
          recommends: r.recommends ?? null,
          favorite_character_name: r.favorite_character_name ?? null,
          favorite_character_notes: r.favorite_character_notes ?? null,
          favorite_character_photo_url: r.favorite_character_photo_url ?? null,
          sort_order: r.sort_order ?? null,
          ...withCreatedAt(r.created_at),
        }))
        const ids = await insertReturningIds('reviews', rows)
        ids.forEach((id, i) => reviewIdMap.set(importedReviews[i].id!, id))
      }

      // 5. Calificaciones personalizadas, remapeando review_id
      const importedRatings = (parsed.customRatings ?? []).filter(
        (cr) => cr.review_id && cr.label && cr.icon && reviewIdMap.has(cr.review_id)
      )
      await insertAll(
        'custom_ratings',
        importedRatings.map((cr) => ({
          review_id: reviewIdMap.get(cr.review_id!)!,
          label: cr.label,
          icon: cr.icon,
          value: cr.value ?? null,
        }))
      )

      // 6. Citas favoritas, remapeando review_id
      const importedQuotes = (parsed.favoriteQuotes ?? []).filter(
        (q) => q.review_id && q.quote_text && reviewIdMap.has(q.review_id)
      )
      await insertAll(
        'favorite_quotes',
        importedQuotes.map((q) => ({
          review_id: reviewIdMap.get(q.review_id!)!,
          quote_text: q.quote_text,
          sort_order: q.sort_order ?? 0,
        }))
      )

      // 7. Historial de lecturas (fuente de verdad del reto anual y del Resumen). Los respaldos
      //    viejos no lo traen: en ese caso se arma una lectura por cada libro terminado con
      //    fecha de fin, igual que cuando un libro pasa a "terminado" en la app. Así esos libros
      //    siguen contando para la meta del año correcto.
      const historyRows = parsed.readingHistory
        ? parsed.readingHistory
            .filter((h) => h.book_id && h.end_date && bookIdMap.has(h.book_id))
            .map((h) => ({
              user_id: userId,
              book_id: bookIdMap.get(h.book_id!)!,
              start_date: h.start_date ?? null,
              end_date: h.end_date,
              ...withCreatedAt(h.created_at),
            }))
        : importedBooks
            .filter((b) => b.status === 'terminado' && b.end_date)
            .map((b) => ({
              user_id: userId,
              book_id: bookIdMap.get(b.id!)!,
              start_date: b.start_date ?? null,
              end_date: b.end_date,
            }))
      await insertAll('reading_history', historyRows)

      // 8 a 10: metas, días de racha y favoritos del mes/año no pueden repetirse (un solo valor
      //    por año, por día o por mes). Si la cuenta ya tiene uno, se conserva el de la cuenta y
      //    se salta el del respaldo, en vez de fallar toda la importación.

      // 8. Metas de lectura (una por año)
      const importedGoals = (parsed.readingGoals ?? []).filter((g) => g.year != null && g.goal != null)
      if (importedGoals.length > 0) {
        const existing = await fetchAllRows((from, to) =>
          supabase.from('reading_goals').select('year').eq('user_id', userId).order('year').range(from, to)
        )
        const takenYears = new Set(existing.map((g) => g.year))
        await insertAll(
          'reading_goals',
          importedGoals
            .filter((g) => !takenYears.has(g.year!))
            .map((g) => ({ user_id: userId, year: g.year, goal: g.goal, ...withCreatedAt(g.created_at) }))
        )
      }

      // 9. Días de racha (uno por fecha)
      const importedSessions = (parsed.readingSessions ?? []).filter((s) => s.session_date)
      if (importedSessions.length > 0) {
        const existing = await fetchAllRows((from, to) =>
          supabase.from('reading_sessions').select('session_date').eq('user_id', userId).order('session_date').range(from, to)
        )
        const takenDates = new Set(existing.map((s) => s.session_date))
        const newDates = new Set(importedSessions.map((s) => s.session_date!).filter((d) => !takenDates.has(d)))
        await insertAll(
          'reading_sessions',
          [...newDates].map((session_date) => ({ user_id: userId, session_date }))
        )
      }

      // 10. Favoritos del mes y del año (uno por mes, y uno por año con month vacío)
      const periodKey = (year: number, month: number | null | undefined) => `${year}-${month ?? 'año'}`
      const importedFavorites = (parsed.periodFavorites ?? []).filter(
        (f) => f.year != null && f.book_id && bookIdMap.has(f.book_id)
      )
      if (importedFavorites.length > 0) {
        const existing = await fetchAllRows((from, to) =>
          supabase.from('period_favorites').select('year, month').eq('user_id', userId).order('id').range(from, to)
        )
        const taken = new Set(existing.map((f) => periodKey(f.year, f.month)))
        await insertAll(
          'period_favorites',
          importedFavorites
            .filter((f) => !taken.has(periodKey(f.year!, f.month)))
            .map((f) => ({
              user_id: userId,
              year: f.year,
              month: f.month ?? null,
              book_id: bookIdMap.get(f.book_id!)!,
              ...withCreatedAt(f.created_at),
            }))
        )
      }

      // 11. Lanzamientos. El enlace al libro de deseados se remapea; si ese libro no vino en el
      //     respaldo, el lanzamiento se conserva sin enlace (igual que al borrar el libro).
      const importedReleases = (parsed.releases ?? []).filter((r) => r.title && r.release_date)
      await insertAll(
        'releases',
        importedReleases.map((r) => ({
          user_id: userId,
          title: r.title,
          author: r.author ?? null,
          release_date: r.release_date,
          place: r.place ?? null,
          price: r.price ?? null,
          book_id: r.book_id ? bookIdMap.get(r.book_id) ?? null : null,
          ...withCreatedAt(r.created_at),
        }))
      )

      // 12. Del perfil solo se recupera lo que afecta cómo se ven los datos (moneda y nombre de
      //     la lista de temporada), y solo si la cuenta todavía no lo tiene. Foto, nickname, bio
      //     y @usuario no se tocan: son de la cuenta actual.
      const backupProfile = parsed.profile
      if (backupProfile && (backupProfile.currency || backupProfile.priority_list_name)) {
        const { data: current, error } = await supabase
          .from('profiles')
          .select('currency, priority_list_name')
          .eq('id', userId)
          .single()
        if (error) throw error
        const changes: { currency?: string; priority_list_name?: string } = {}
        if (!current.currency && backupProfile.currency) changes.currency = backupProfile.currency
        if (!current.priority_list_name && backupProfile.priority_list_name) {
          changes.priority_list_name = backupProfile.priority_list_name
        }
        if (Object.keys(changes).length > 0) {
          const { error: updateError } = await supabase.from('profiles').update(changes).eq('id', userId)
          if (updateError) throw updateError
        }
      }

      // Las pantallas guardan sus datos en caché: se refrescan todas para que lo importado
      // aparezca de una vez, sin tener que cerrar y abrir la app.
      await queryClient.invalidateQueries()
      return true
    } catch {
      return false
    } finally {
      setIsImporting(false)
    }
  }

  return { importData, isImporting }
}
