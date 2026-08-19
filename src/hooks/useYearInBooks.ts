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

/** Trae los libros terminados de un usuario en un año puntual, agrupados por mes —
 *  usado por el modal "Libros leídos en 20XX" que se abre desde la tarjeta de año en
 *  Perfil. Solo se activa cuando `year` no es null (el modal está abierto). */
export function useYearInBooks(userId: string | undefined, year: number | null) {
  const [data, setData] = useState<YearInBooksData>(emptyData)
  const [isLoading, setIsLoading] = useState(false)

  const refetch = useCallback(async () => {
    if (!userId || year === null) {
      setData(emptyData)
      return
    }
    setIsLoading(true)

    const { data: rows } = await supabase
      .from('books')
      .select('id, title, cover_url, end_date, total_pages, total_duration_seconds, format')
      .eq('user_id', userId)
      .eq('status', 'terminado')
      .gte('end_date', `${year}-01-01`)
      .lte('end_date', `${year}-12-31`)
      .order('end_date', { ascending: true })

    const books = rows ?? []
    const totalPages = books.reduce((sum, b) => sum + (b.total_pages ?? 0), 0)
    const totalAudioSeconds = books
      .filter((b) => b.format === 'audiolibro')
      .reduce((sum, b) => sum + (b.total_duration_seconds ?? 0), 0)

    const byMonth = new Map<number, YearBookEntry[]>()
    for (const b of books) {
      if (!b.end_date) continue
      const month = parseInt(b.end_date.slice(5, 7), 10)
      const list = byMonth.get(month) ?? []
      list.push({ id: b.id, title: b.title, cover_url: b.cover_url })
      byMonth.set(month, list)
    }
    const months = Array.from(byMonth.entries())
      .sort(([a], [b]) => a - b)
      .map(([month, monthBooks]) => ({ month, books: monthBooks }))

    setData({ totalBooks: books.length, totalPages, totalAudioSeconds, months })
    setIsLoading(false)
  }, [userId, year])

  useEffect(() => { refetch() }, [refetch])

  return { data, isLoading }
}
