import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface Stats {
  pagesRead: number
  audioSeconds: number
  finishedCount: number
  readingCount: number
  wishlistCount: number
  abandonedCount: number
  sagaCount: number
  reviewCount: number
  longestStreak: number
  yearsBreakdown: { year: number; count: number }[]
}

const emptyStats: Stats = {
  pagesRead: 0, audioSeconds: 0, finishedCount: 0, readingCount: 0,
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
    ] = await Promise.all([
      supabase.from('books').select('status, total_pages, total_duration_seconds, format, end_date').eq('user_id', userId),
      supabase.from('sagas').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('reading_sessions').select('session_date').eq('user_id', userId),
    ])

    const allBooks = books ?? []
    const finished = allBooks.filter((b) => b.status === 'terminado')

    const pagesRead = finished.reduce((sum, b) => sum + (b.total_pages ?? 0), 0)
    const audioSeconds = finished
      .filter((b) => b.format === 'audiolibro')
      .reduce((sum, b) => sum + (b.total_duration_seconds ?? 0), 0)

    const yearCounts = new Map<number, number>()
    finished.forEach((b) => {
      if (!b.end_date) return
      const year = new Date(b.end_date).getFullYear()
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