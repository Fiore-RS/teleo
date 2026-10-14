import { useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { todayLocalDate } from '../lib/date'
import { buildRecap, periodBounds, type RecapPeriod } from '../lib/recap'
import { useCachedQuery } from './useCachedQuery'
import { useYearReads } from './useYearReads'
import { usePeriodFavorites } from './usePeriodFavorites'

const EMPTY_DATES: string[] = []
const EMPTY_PRIOR: Record<string, number> = {}

/** Datos de "Tu lectura en Teleo" (V.3.2.0) para un mes o un año. Reusa las consultas que ya
 *  usa Bitácora (lecturas del año, favoritos y sesiones de lectura, con las mismas claves de
 *  caché) y suma una sola: cuántas veces se habían terminado antes los libros del periodo,
 *  para marcar las relecturas. */
export function useRecap(userId: string | undefined, periodInput: RecapPeriod) {
  // El periodo se rearma con sus valores para que un objeto nuevo en cada render no repita
  // los cálculos.
  const { kind, year } = periodInput
  const month = periodInput.kind === 'mes' ? periodInput.month : 0
  const period = useMemo<RecapPeriod>(() => (kind === 'mes' ? { kind, year, month } : { kind, year }), [kind, year, month])
  const { reads: yearReads, isLoading: readsLoading } = useYearReads(userId, period.year)
  const { favorites, isLoading: favoritesLoading } = usePeriodFavorites(userId, period.year)

  // Misma clave y forma que useReadingStreak: comparten la caché.
  const { data: sessionDates, isLoading: sessionsLoading } = useCachedQuery<string[]>(
    ['readingSessions', userId],
    async () => {
      const { data } = await supabase.from('reading_sessions').select('session_date').eq('user_id', userId!)
      return (data ?? []).map((r) => r.session_date)
    },
    EMPTY_DATES,
    { enabled: !!userId }
  )

  const reads = useMemo(
    () => (period.kind === 'mes' ? yearReads.filter((r) => r.month === period.month) : yearReads),
    [yearReads, period]
  )
  const { start } = periodBounds(period)
  const bookIds = useMemo(() => [...new Set(reads.map((r) => r.bookId))].sort(), [reads])

  const { data: prior, isLoading: priorLoading } = useCachedQuery<Record<string, number>>(
    ['recapPriorReads', userId, start, bookIds.join(',')],
    async () => {
      const { data } = await supabase
        .from('reading_history')
        .select('book_id')
        .eq('user_id', userId!)
        .in('book_id', bookIds)
        .lt('end_date', start)
      const counts: Record<string, number> = {}
      for (const row of data ?? []) counts[row.book_id] = (counts[row.book_id] ?? 0) + 1
      return counts
    },
    EMPTY_PRIOR,
    { enabled: !!userId && bookIds.length > 0 }
  )

  const favoriteBookId =
    favorites.find((f) => f.month === (period.kind === 'mes' ? period.month : null))?.bookId ?? null
  const today = todayLocalDate()

  const recap = useMemo(
    () =>
      buildRecap({
        period,
        reads,
        sessionDates,
        priorCompletions: new Map(Object.entries(prior)),
        favoriteBookId,
        today,
      }),
    [period, reads, sessionDates, prior, favoriteBookId, today]
  )

  const isLoading = readsLoading || favoritesLoading || sessionsLoading || (bookIds.length > 0 && priorLoading)
  return { recap, isLoading }
}
