import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useReadingStreak(userId: string | undefined) {
  const [streak, setStreak] = useState(0)
  const [markedToday, setMarkedToday] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!userId) return
    setIsLoading(true)

    const { data } = await supabase
      .from('reading_sessions')
      .select('session_date')
      .eq('user_id', userId)

    const dates = new Set((data ?? []).map((r) => r.session_date))
    const today = new Date().toISOString().slice(0, 10)
    const cursor = new Date()

    if (dates.has(today)) {
      setMarkedToday(true)
    } else {
      cursor.setDate(cursor.getDate() - 1) // la racha puede seguir viva si ayer sí se marcó
    }

    let count = 0
    while (dates.has(cursor.toISOString().slice(0, 10))) {
      count++
      cursor.setDate(cursor.getDate() - 1)
    }

    setStreak(count)
    setIsLoading(false)
  }, [userId])

  useEffect(() => {
    refetch()
  }, [refetch])

  async function markToday() {
    if (!userId || markedToday) return
    const today = new Date().toISOString().slice(0, 10)
    const { error } = await supabase
      .from('reading_sessions')
      .insert({ user_id: userId, session_date: today })

    if (!error) {
      setMarkedToday(true)
      await refetch()
    }
  }

  return { streak, markedToday, markToday, isLoading }
}