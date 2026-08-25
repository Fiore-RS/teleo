import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

/** Meta anual de lectura del usuario, leída/escrita como una fila por año en
 *  `reading_goals`. Al usar el año en curso como parte de la clave, el "reinicio"
 *  cada 1 de enero es automático: simplemente no existe todavía una fila para el
 *  año nuevo, así que la meta empieza en 0 sin necesidad de ningún job/cron. */
export function useAnnualGoal(userId: string | undefined) {
  const [goal, setGoal] = useState(0)
  const [completedCount, setCompletedCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!userId) return
    setIsLoading(true)
    const year = new Date().getFullYear()

    // Se cuenta desde `reading_history` (no `books` directamente) para que una relectura
    // terminada este año también sume hacia la meta anual, sin depender de que sea la
    // primera vez que se termina el libro.
    const [{ data: goalRow }, { count }] = await Promise.all([
      supabase.from('reading_goals').select('goal').eq('user_id', userId).eq('year', year).maybeSingle(),
      supabase
        .from('reading_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('end_date', `${year}-01-01`)
        .lte('end_date', `${year}-12-31`),
    ])

    setGoal(goalRow?.goal ?? 0)
    setCompletedCount(count ?? 0)
    setIsLoading(false)
  }, [userId])

  useEffect(() => {
    refetch()
  }, [refetch])

  async function updateGoal(newGoal: number) {
    if (!userId) return
    const year = new Date().getFullYear()
    await supabase.from('reading_goals').upsert({ user_id: userId, year, goal: newGoal }, { onConflict: 'user_id,year' })
    await refetch()
  }

  return { goal, completedCount, isLoading, refetch, updateGoal }
}
