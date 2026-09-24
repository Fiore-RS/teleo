import { useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { formatLocalDate, todayLocalDate } from '../lib/date'
import { useCachedQuery } from './useCachedQuery'
import { computeLongestStreak } from '../lib/streak'

const EMPTY: string[] = []

export function useReadingStreak(userId: string | undefined) {
  // En caché se guardan solo las fechas marcadas; la racha, "hoy marcado" y la semana se
  // calculan al renderizar contra la fecha actual, así siempre están al día.
  const { data: sessionDates, setData: setSessionDates, isLoading, refetch } = useCachedQuery(
    ['readingSessions', userId],
    async () => {
      const { data } = await supabase
        .from('reading_sessions')
        .select('session_date')
        .eq('user_id', userId!)
      return (data ?? []).map((r) => r.session_date)
    },
    EMPTY,
    { enabled: !!userId }
  )

  const today = todayLocalDate()

  const { streak, markedToday, weekDays } = useMemo(() => {
    const dates = new Set(sessionDates)
    const cursor = new Date()
    const marked = dates.has(today)
    if (!marked) cursor.setDate(cursor.getDate() - 1) // la racha puede seguir viva si ayer sí se marcó

    let count = 0
    while (dates.has(formatLocalDate(cursor))) {
      count++
      cursor.setDate(cursor.getDate() - 1)
    }

    /** Semana actual de lunes a domingo, con si hubo sesión cada día y si el día todavía no
     *  llega. Para la fila de la semana en la tarjeta de racha de Mesa. */
    const monday = new Date()
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7)) // getDay(): 0 = domingo
    const week: { date: string; read: boolean; isToday: boolean; isFuture: boolean }[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      const key = formatLocalDate(d)
      week.push({ date: key, read: dates.has(key), isToday: key === today, isFuture: key > today })
    }

    return { streak: count, markedToday: marked, weekDays: week }
  }, [sessionDates, today])

  // El día puede haber cambiado mientras la app seguía abierta en segundo plano (ej. el
  // celular se bloqueó a las 6pm marcada la sesión, y se desbloquea al día siguiente sin
  // recargar la página) — sin esto, "Sesión de hoy marcada" se quedaría pegado hasta que
  // se navegue a otra pantalla y se vuelva. Al recuperar el foco/visibilidad, se vuelve a
  // pedir y calcular todo contra la fecha actual.
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
    const { error } = await supabase
      .from('reading_sessions')
      .insert({ user_id: userId, session_date: today })

    if (!error) {
      setSessionDates((prev) => [...prev, today])
      await refetch()
    }
  }

  // Por si se le da click por accidente al botón ya marcado: permite deshacer la sesión de
  // hoy (se confirma con un popup antes, ver `UnmarkStreakModal`).
  async function unmarkToday() {
    if (!userId || !markedToday) return
    const { error } = await supabase
      .from('reading_sessions')
      .delete()
      .eq('user_id', userId)
      .eq('session_date', today)

    if (!error) {
      setSessionDates((prev) => prev.filter((d) => d !== today))
      await refetch()
    }
  }

  // Para el calendario de lectura: todas las fechas marcadas y la racha más larga.
  const markedDates = useMemo(() => new Set(sessionDates), [sessionDates])
  const longestStreak = useMemo(() => computeLongestStreak(sessionDates), [sessionDates])

  return { streak, markedToday, markToday, unmarkToday, isLoading, weekDays, markedDates, longestStreak }
}
