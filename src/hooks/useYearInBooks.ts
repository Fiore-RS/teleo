import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export interface YearBookEntry {
  id: string
  title: string
  cover_url: string | null
}

export interface MonthGroup {
  month: number // 1-12
  books: YearBookEntry[]
}

export interface YearInBooksData {
  totalBooks: number
  totalPages: number
  totalAudioSeconds: number
  months: MonthGroup[] // solo meses con al menos 1 libro, en orden enero -> diciembre
}

const emptyData: YearInBooksData = { totalBooks: 0, totalPages: 0, totalAudioSeconds: 0, months: [] }

/** Trae las lecturas completadas de un usuario en un año puntual (desde `reading_history`,
 *  no directamente los libros "terminado" — así una relectura terminada ese año aparece
 *  como una entrada más, aunque sea el mismo libro), agrupadas por mes. Usado por el modal
 *  "Libros leídos en 20XX" que se abre desde la tarjeta de año en Perfil. Solo se activa
 *  cuando `year` no es null (el modal está abierto). */
export function useYearInBooks(userId: string | undefined, year: number | null) {
  const [data, setData] = useState<YearInBooksData>(emptyData)
  const [isLoading, setIsLoading] = useState(false)

  const refetch = useCallback(async () => {
    if (!userId || year === null) {
      setData(emptyData)
      return
    }
    setIsLoading(true)

    const { data: historyRows } = await supabase
      .from('reading_history')
      .select('book_id, end_date')
      .eq('user_id', userId)
      .gte('end_date', `${year}-01-01`)
      .lte('end_date', `${year}-12-31`)
      .order('end_date', { ascending: true })

    const reads = historyRows ?? []
    const bookIds = [...new Set(reads.map((r) => r.book_id))]

    let books: { id: string; title: string; cover_url: string | null; total_pages: number | null; total_duration_seconds: number | null; format: string | null }[] = []
    if (bookIds.length > 0) {
      const { data: bookRows } = await supabase
        .from('books')
        .select('id, title, cover_url, total_pages, total_duration_seconds, format')
        .in('id', bookIds)
      books = bookRows ?? []
    }
    const bookById = new Map(books.map((b) => [b.id, b]))

    const totalPages = reads.reduce((sum, r) => sum + (bookById.get(r.book_id)?.total_pages ?? 0), 0)
    const totalAudioSeconds = reads
      .filter((r) => bookById.get(r.book_id)?.format === 'audiolibro')
      .reduce((sum, r) => sum + (bookById.get(r.book_id)?.total_duration_seconds ?? 0), 0)

    const byMonth = new Map<number, YearBookEntry[]>()
    for (const r of reads) {
      const book = bookById.get(r.book_id)
      if (!book) continue
      const month = parseInt(r.end_date.slice(5, 7), 10)
      const list = byMonth.get(month) ?? []
      list.push({ id: book.id, title: book.title, cover_url: book.cover_url })
      byMonth.set(month, list)
    }
    const months = Array.from(byMonth.entries())
      .sort(([a], [b]) => a - b)
      .map(([month, monthBooks]) => ({ month, books: monthBooks }))

    setData({ totalBooks: reads.length, totalPages, totalAudioSeconds, months })
    setIsLoading(false)
  }, [userId, year])

  useEffect(() => { refetch() }, [refetch])

  return { data, isLoading }
}
