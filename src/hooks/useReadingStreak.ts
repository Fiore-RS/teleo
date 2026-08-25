import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { formatLocalDate, todayLocalDate } from '../lib/date'

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
    const today = todayLocalDate()
    const cursor = new Date()

    if (dates.has(today)) {
      setMarkedToday(true)
    } else {
      setMarkedToday(false)
      cursor.setDate(cursor.getDate() - 1) // la racha puede seguir viva si ayer sí se marcó
    }

    let count = 0
    while (dates.has(formatLocalDate(cursor))) {
      count++
      cursor.setDate(cursor.getDate() - 1)
    }

    setStreak(count)
    setIsLoading(false)
  }, [userId])

  useEffect(() => {
    refetch()
  }, [refetch])

  // El día puede haber cambiado mientras la app seguía abierta en segundo plano (ej. el
  // celular se bloqueó a las 6pm marcada la sesión, y se desbloquea al día siguiente sin
  // recargar la página) — sin esto, "Sesión de hoy marcada" se quedaría pegado hasta que
  // se navegue a otra pantalla y se vuelva. Al recuperar el foco/visibilidad, se vuelve a
  // calcular todo contra la fecha actual.
  useEffect(() => {
    function handleVisible() {
      if (document.visibilityState === 'visible') refetch()
    }
    document.addEventListener('visibilitychange', handleVisible)
    window.addEventListener('focus', refetch)
    return () => {
      document.removeEventListener('visibilitychange', handleVisible)
      window.removeEventListener('focus', refetch)
    }
  }, [refetch])

  async function markToday() {
    if (!userId || markedToday) return
    const today = todayLocalDate()
    const { error } = await supabase
      .from('reading_sessions')
      .insert({ user_id: userId, session_date: today })

    if (!error) {
      setMarkedToday(true)
      await refetch()
    }
  }

  // Por si se le da click por accidente al botón ya marcado: permite deshacer la sesión de
  // hoy (se confirma con un popup antes, ver `UnmarkStreakModal`).
  async function unmarkToday() {
    if (!userId || !markedToday) return
    const today = todayLocalDate()
    const { error } = await supabase
      .from('reading_sessions')
      .delete()
      .eq('user_id', userId)
      .eq('session_date', today)

    if (!error) {
      setMarkedToday(false)
      await refetch()
    }
  }

  return { streak, markedToday, markToday, unmarkToday, isLoading }
}
