import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export interface GoalHistoryEntry {
  year: number
  goal: number
  completedCount: number
}

/** Historial de metas anuales de lectura: una fila de `reading_goals` por año,
 *  cruzada con la cantidad de libros terminados ese mismo año, para mostrar en
 *  la sección "Metas de lectura" del perfil. */
export function useGoalHistory(userId: string | undefined) {
  const [history, setHistory] = useState<GoalHistoryEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!userId) return
    setIsLoading(true)

    const [{ data: goalRows }, { data: bookRows }] = await Promise.all([
      supabase.from('reading_goals').select('year, goal').eq('user_id', userId).order('year', { ascending: false }),
      supabase.from('books').select('end_date').eq('user_id', userId).eq('status', 'terminado').not('end_date', 'is', null),
    ])

    const countsByYear = new Map<number, number>()
    for (const b of bookRows ?? []) {
      if (!b.end_date) continue
      const year = parseInt(b.end_date.slice(0, 4), 10)
      countsByYear.set(year, (countsByYear.get(year) ?? 0) + 1)
    }

    const entries: GoalHistoryEntry[] = (goalRows ?? []).map(({ year, goal }) => ({
      year, goal, completedCount: countsByYear.get(year) ?? 0,
    }))

    setHistory(entries)
    setIsLoading(false)
  }, [userId])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { history, isLoading, refetch }
}
