import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { formatLocalDate } from '../lib/date'
import type { Database } from '../types/database'

type Book = Database['public']['Tables']['books']['Row']

/** Datos puntuales para la tarjeta de perfil compartible que no cubre ningún hook
 *  existente: el libro terminado más reciente (+ su calificación, si ya tiene reseña),
 *  y los días de lectura marcados de los últimos 2 meses (mes actual + el anterior, para
 *  mostrar el mismo calendario de 2 meses que Bitácora) — acotado a esos 2 meses en vez
 *  de traer todo el historial, ya que acá no hace falta navegar hacia atrás. */
export function useShareCardExtras(userId: string | undefined) {
  const [recentFinishedBook, setRecentFinishedBook] = useState<Book | null>(null)
  const [recentFinishedRating, setRecentFinishedRating] = useState<number | null>(null)
  const [sessionDates, setSessionDates] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!userId) return
    setIsLoading(true)

    const now = new Date()
    // Rango de 2 meses (el actual + el anterior), igual que el calendario de "Ritmo y
    // hábito" en Bitácora — acá siempre son los 2 más recientes, sin flechas para navegar.
    const rangeStart = formatLocalDate(new Date(now.getFullYear(), now.getMonth() - 1, 1))
    const rangeEnd = formatLocalDate(new Date(now.getFullYear(), now.getMonth() + 1, 0))

    const [{ data: finished }, { data: sessions }] = await Promise.all([
      supabase
        .from('books')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'terminado')
        .order('end_date', { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('reading_sessions')
        .select('session_date')
        .eq('user_id', userId)
        .gte('session_date', rangeStart)
        .lte('session_date', rangeEnd),
    ])

    setRecentFinishedBook(finished ?? null)
    setSessionDates(new Set((sessions ?? []).map((s) => s.session_date)))

    if (finished) {
      const { data: review } = await supabase
        .from('reviews')
        .select('general_rating')
        .eq('user_id', userId)
        .eq('book_id', finished.id)
        .maybeSingle()
      setRecentFinishedRating(review?.general_rating ?? null)
    } else {
      setRecentFinishedRating(null)
    }

    setIsLoading(false)
  }, [userId])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { recentFinishedBook, recentFinishedRating, sessionDates, isLoading, refetch }
}
