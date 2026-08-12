import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useAnnualGoal(userId: string | undefined) {
  const [goal, setGoal] = useState(0)
  const [completedCount, setCompletedCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!userId) return
    setIsLoading(true)
    const year = new Date().getFullYear()

    const [{ data: profile }, { count }] = await Promise.all([
      supabase.from('profiles').select('annual_goal').eq('id', userId).single(),
      supabase
        .from('books')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'terminado')
        .gte('end_date', `${year}-01-01`)
        .lte('end_date', `${year}-12-31`),
    ])

    setGoal(profile?.annual_goal ?? 0)
    setCompletedCount(count ?? 0)
    setIsLoading(false)
  }, [userId])

  useEffect(() => {
    refetch()
  }, [refetch])

  async function updateGoal(newGoal: number) {
    if (!userId) return
    await supabase.from('profiles').update({ annual_goal: newGoal }).eq('id', userId)
    await refetch()
  }

  return { goal, completedCount, isLoading, refetch, updateGoal }
}