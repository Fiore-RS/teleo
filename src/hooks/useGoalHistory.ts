import { supabase } from '../lib/supabase'
import { useCachedQuery } from './useCachedQuery'

export interface GoalHistoryEntry {
  year: number
  goal: number
  completedCount: number
}

const EMPTY: GoalHistoryEntry[] = []

/** Historial de metas anuales de lectura: una fila de `reading_goals` por año, cruzada con
 *  la cantidad de lecturas completadas ese mismo año (según `reading_history`, que cuenta
 *  cada relectura terminada ese año además de la primera lectura). */
export function useGoalHistory(userId: string | undefined) {
  const { data: history, isLoading, refetch } = useCachedQuery(
    ['goalHistory', userId],
    async () => {
      const [{ data: goalRows }, { data: historyRows }] = await Promise.all([
        supabase.from('reading_goals').select('year, goal').eq('user_id', userId!).order('year', { ascending: false }),
        supabase.from('reading_history').select('end_date').eq('user_id', userId!),
      ])

      const countsByYear = new Map<number, number>()
      for (const h of historyRows ?? []) {
        const year = parseInt(h.end_date.slice(0, 4), 10)
        countsByYear.set(year, (countsByYear.get(year) ?? 0) + 1)
      }

      return (goalRows ?? []).map(({ year, goal }) => ({
        year, goal, completedCount: countsByYear.get(year) ?? 0,
      }))
    },
    EMPTY,
    { enabled: !!userId }
  )

  return { history, isLoading, refetch }
}
