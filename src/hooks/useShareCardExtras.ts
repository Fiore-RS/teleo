import { useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useCachedQuery } from './useCachedQuery'
import { formatLocalDate } from '../lib/date'
import type { Database } from '../types/database'

type Book = Database['public']['Tables']['books']['Row']

interface ShareCardExtras {
  recentFinishedBook: Book | null
  recentFinishedRating: number | null
  sessionDateList: string[]
}

const EMPTY: ShareCardExtras = { recentFinishedBook: null, recentFinishedRating: null, sessionDateList: [] }

/** Datos puntuales para la tarjeta de perfil compartible que no cubre ningún hook
 *  existente: el libro terminado más reciente (+ su calificación, si ya tiene reseña),
 *  y los días de lectura marcados de los últimos 2 meses (mes actual + el anterior, para
 *  mostrar el mismo calendario de 2 meses que Bitácora) — acotado a esos 2 meses en vez
 *  de traer todo el historial, ya que acá no hace falta navegar hacia atrás. */
export function useShareCardExtras(userId: string | undefined) {
  async function fetchExtras(): Promise<ShareCardExtras> {
    if (!userId) return EMPTY

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

    const recentFinishedBook = finished ?? null
    const sessionDateList = (sessions ?? []).map((s) => s.session_date)
    let recentFinishedRating: number | null = null

    if (finished) {
      const { data: review } = await supabase
        .from('reviews')
        .select('general_rating')
        .eq('user_id', userId)
        .eq('book_id', finished.id)
        .maybeSingle()
      recentFinishedRating = review?.general_rating ?? null
    }

    return { recentFinishedBook, recentFinishedRating, sessionDateList }
  }

  const { data, isLoading, refetch } = useCachedQuery(['shareCardExtras', userId], fetchExtras, EMPTY, {
    enabled: !!userId,
  })
  const sessionDates = useMemo(() => new Set(data.sessionDateList), [data.sessionDateList])
  const { recentFinishedBook, recentFinishedRating } = data

  return { recentFinishedBook, recentFinishedRating, sessionDates, isLoading, refetch }
}
