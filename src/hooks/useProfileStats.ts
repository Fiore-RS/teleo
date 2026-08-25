import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface Stats {
  pagesRead: number
  audioSeconds: number
  finishedCount: number
  finishedThisYearCount: number
  readingCount: number
  wishlistCount: number
  abandonedCount: number
  sagaCount: number
  reviewCount: number
  longestStreak: number
  yearsBreakdown: { year: number; count: number }[]
}

const emptyStats: Stats = {
  pagesRead: 0, audioSeconds: 0, finishedCount: 0, finishedThisYearCount: 0, readingCount: 0,
  wishlistCount: 0, abandonedCount: 0, sagaCount: 0, reviewCount: 0,
  longestStreak: 0, yearsBreakdown: [],
}

function computeLongestStreak(dates: string[]): number {
  const sorted = [...new Set(dates)].sort()
  let longest = 0
  let current = 0
  let prevDate: Date | null = null

  for (const d of sorted) {
    const date = new Date(d)
    if (prevDate) {
      const diffDays = Math.round((date.getTime() - prevDate.getTime()) / 86400000)
      current = diffDays === 1 ? current + 1 : 1
    } else {
      current = 1
    }
    longest = Math.max(longest, current)
    prevDate = date
  }
  return longest
}

export function useProfileStats(userId: string | undefined) {
  const [stats, setStats] = useState<Stats>(emptyStats)
  const [isLoading, setIsLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!userId) return
    setIsLoading(true)

    const [
      { data: books },
      { count: sagaCount },
      { count: reviewCount },
      { data: sessions },
      { data: historyRows },
    ] = await Promise.all([
      supabase.from('books').select('id, status, total_pages, total_duration_seconds, format, end_date').eq('user_id', userId),
      supabase.from('sagas').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('reading_sessions').select('session_date').eq('user_id', userId),
      supabase.from('reading_history').select('book_id, end_date').eq('user_id', userId),
    ])

    const allBooks = books ?? []
    const finished = allBooks.filter((b) => b.status === 'terminado')
    const bookById = new Map(allBooks.map((b) => [b.id, b]))
    const reads = historyRows ?? []

    const currentYear = new Date().getFullYear()
    const finishedThisYear = finished.filter((b) => b.end_date && parseInt(b.end_date.slice(0, 4), 10) === currentYear)

    // Páginas leídas y tiempo escuchado se suman por CADA lectura completada (una relectura
    // vuelve a sumar las mismas páginas/duración) — a diferencia de "Libros terminados", que
    // sigue contando libros distintos: volver a leer el mismo libro sí cuenta como más
    // páginas/tiempo leído en la vida real, aunque siga siendo "el mismo libro".
    const pagesRead = reads.reduce((sum, h) => sum + (bookById.get(h.book_id)?.total_pages ?? 0), 0)
    const audioSeconds = reads
      .filter((h) => bookById.get(h.book_id)?.format === 'audiolibro')
      .reduce((sum, h) => sum + (bookById.get(h.book_id)?.total_duration_seconds ?? 0), 0)

    // Se cuenta desde `reading_history` (no directamente los libros "terminado") para que
    // una relectura sume en el año en que se completó, sin robarle el año a la primera vez
    // que se terminó el libro.
    const yearCounts = new Map<number, number>()
    reads.forEach((h) => {
      const year = parseInt(h.end_date.slice(0, 4), 10)
      yearCounts.set(year, (yearCounts.get(year) ?? 0) + 1)
    })
    const yearsBreakdown = Array.from(yearCounts.entries())
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => b.year - a.year)

    const longestStreak = computeLongestStreak((sessions ?? []).map((s) => s.session_date))

    setStats({
      pagesRead,
      audioSeconds,
      finishedCount: finished.length,
      finishedThisYearCount: finishedThisYear.length,
      readingCount: allBooks.filter((b) => b.status === 'leyendo').length,
      wishlistCount: allBooks.filter((b) => b.status === 'deseado').length,
      abandonedCount: allBooks.filter((b) => b.status === 'abandonado').length,
      sagaCount: sagaCount ?? 0,
      reviewCount: reviewCount ?? 0,
      longestStreak,
      yearsBreakdown,
    })
    setIsLoading(false)
  }, [userId])

  useEffect(() => { refetch() }, [refetch])

  return { stats, isLoading, refetch }
}