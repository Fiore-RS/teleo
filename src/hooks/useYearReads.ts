import { supabase } from '../lib/supabase'
import { readingAmounts, readingFormatOf } from '../lib/readingHistory'
import { useCachedQuery } from './useCachedQuery'

export interface YearRead {
  /** id de la fila de reading_history (un libro releído aparece más de una vez). */
  id: string
  bookId: string
  title: string
  author: string | null
  coverUrl: string | null
  endDate: string
  month: number // 1-12
  /** Páginas del libro (0 si no se sabe). */
  pages: number
  /** V.4.5.1: duración si es audiolibro (0 si no lo es o no se sabe). */
  audioSeconds: number
  category: string | null
  format: string | null
  /** Rasgos del libro (V.3.1.0), para "Géneros y ánimos" del año. */
  genres: string[]
  moods: string[]
  custom_moods: string[]
  pace: string | null
}

export interface YearReadsData {
  reads: YearRead[]
  totalPages: number
  totalAudioSeconds: number
}

const EMPTY: YearReadsData = { reads: [], totalPages: 0, totalAudioSeconds: 0 }

interface HistoryRow {
  id: string
  book_id: string
  end_date: string
  format: string | null
  books: {
    title: string
    author: string | null
    cover_url: string | null
    total_pages: number | null
    total_duration_seconds: number | null
    format: string | null
    category: string | null
    genres: string[]
    moods: string[]
    custom_moods: string[]
    pace: string | null
  } | null
}

/** Libros terminados en un año, desde reading_history (fase 6, Resumen). Así una relectura
 *  aparece en el mes en que se volvió a terminar. Ordenados por fecha de fin. */
export function useYearReads(userId: string | undefined, year: number) {
  const { data, isLoading } = useCachedQuery<YearReadsData>(
    ['yearReads', userId, year],
    async () => {
      const { data: rows } = await supabase
        .from('reading_history')
        .select('id, book_id, end_date, format, books(title, author, cover_url, total_pages, total_duration_seconds, format, category, genres, moods, custom_moods, pace)')
        .eq('user_id', userId!)
        .gte('end_date', `${year}-01-01`)
        .lte('end_date', `${year}-12-31`)
        .order('end_date', { ascending: true })

      const history = (rows ?? []) as unknown as HistoryRow[]
      let totalPages = 0
      let totalAudioSeconds = 0
      const reads: YearRead[] = []
      for (const row of history) {
        if (!row.books) continue
        // V.4.6.0: cada lectura suma según su propio formato.
        const format = readingFormatOf(row.format, row.books.format)
        const amounts = readingAmounts(format, row.books)
        totalPages += amounts.pages
        totalAudioSeconds += amounts.audioSeconds
        reads.push({
          id: row.id,
          bookId: row.book_id,
          title: row.books.title,
          author: row.books.author,
          coverUrl: row.books.cover_url,
          endDate: row.end_date,
          month: parseInt(row.end_date.slice(5, 7), 10),
          pages: amounts.pages,
          audioSeconds: amounts.audioSeconds,
          category: row.books.category,
          format,
          genres: row.books.genres ?? [],
          moods: row.books.moods ?? [],
          custom_moods: row.books.custom_moods ?? [],
          pace: row.books.pace,
        })
      }
      return { reads, totalPages, totalAudioSeconds }
    },
    EMPTY,
    { enabled: !!userId }
  )

  return { ...data, isLoading }
}
