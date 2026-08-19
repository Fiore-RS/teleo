import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export interface GoalHistoryEntry {
  year: number
  goal: number
  completedCount: number
  /** 'superada' | 'cumplida' | 'incompleta' */
  outcome: 'superada' | 'cumplida' | 'incompleta'
  message: string
}

function buildMessage(goal: number, completed: number): { outcome: GoalHistoryEntry['outcome']; message: string } {
  if (completed > goal) {
    const extra = completed - goal
    return {
      outcome: 'superada',
      message: `¡Superaste tu meta por ${extra} ${extra === 1 ? 'libro' : 'libros'}! 🎉`,
    }
  }
  if (completed === goal) {
    return { outcome: 'cumplida', message: '¡Cumpliste tu meta exacta! 🎯' }
  }
  const missing = goal - completed
  return {
    outcome: 'incompleta',
    message: `Te quedaste a ${missing} ${missing === 1 ? 'libro' : 'libros'} de tu meta.`,
  }
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

    const entries: GoalHistoryEntry[] = (goalRows ?? []).map(({ year, goal }) => {
      const completedCount = countsByYear.get(year) ?? 0
      const { outcome, message } = buildMessage(goal, completedCount)
      return { year, goal, completedCount, outcome, message }
    })

    setHistory(entries)
    setIsLoading(false)
  }, [userId])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { history, isLoading, refetch }
}
