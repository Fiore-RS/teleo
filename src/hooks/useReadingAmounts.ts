import { useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { fetchAllRows } from '../lib/fetchAllRows'
import { todayLocalDate } from '../lib/date'
import { amountsBetween, dailyAmounts, type AmountBook, type AmountLog, type AmountReading, type DayAmount } from '../lib/readingAmounts'
import { useCachedQuery } from './useCachedQuery'

interface Sources {
  readings: AmountReading[]
  books: AmountBook[]
  logs: AmountLog[]
}

const EMPTY: Sources = { readings: [], books: [], logs: [] }

/** Páginas y tiempo leídos por día (V.4.6.0, lib/readingAmounts.ts), para sumar lo que se
 *  avanzó en un mes o un año. Devuelve una función que suma entre dos fechas. */
export function useReadingAmounts(userId: string | undefined) {
  const { data, isLoading } = useCachedQuery<Sources>(
    ['readingAmounts', userId],
    async () => {
      const [readings, books, logs] = await Promise.all([
        fetchAllRows((from, to) =>
          supabase.from('reading_history').select('id, book_id, start_date, end_date, format').eq('user_id', userId!).order('id').range(from, to)
        ),
        fetchAllRows((from, to) =>
          supabase
            .from('books')
            .select('id, status, format, start_date, total_pages, total_duration_seconds, current_page, current_duration_seconds')
            .eq('user_id', userId!)
            .order('id')
            .range(from, to)
        ),
        fetchAllRows((from, to) =>
          supabase.from('progress_log').select('id, book_id, logged_on, pages, seconds').eq('user_id', userId!).order('id').range(from, to)
        ),
      ])
      return { readings, books, logs }
    },
    EMPTY,
    { enabled: !!userId }
  )

  const today = todayLocalDate()
  const daily = useMemo(() => dailyAmounts(data.readings, data.books, data.logs, today), [data, today])
  const between = useMemo(() => (from: string, to: string): DayAmount => amountsBetween(daily, from, to), [daily])
  return { between, isLoading }
}
