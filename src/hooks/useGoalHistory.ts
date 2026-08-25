import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export interface GoalHistoryEntry {
  year: number
  goal: number
  completedCount: number
}

/** Historial de metas anuales de lectura: una fila de `reading_goals` por año, cruzada con
 *  la cantidad de lecturas completadas ese mismo año (según `reading_history`, que cuenta
 *  cada relectura terminada ese año además de la primera lectura). */
export function useGoalHistory(userId: string | undefined) {
  const [history, setHistory] = useState<GoalHistoryEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!userId) return
    setIsLoading(true)

    const [{ data: goalRows }, { data: historyRows }] = await Promise.all([
      supabase.from('reading_goals').select('year, goal').eq('user_id', userId).order('year', { ascending: false }),
      supabase.from('reading_history').select('end_date').eq('user_id', userId),
    ])

    const countsByYear = new Map<number, number>()
    for (const h of historyRows ?? []) {
      const year = parseInt(h.end_date.slice(0, 4), 10)
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
