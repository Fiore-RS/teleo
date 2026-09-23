import { supabase } from '../lib/supabase'
import { useCachedQuery } from './useCachedQuery'

interface MonthReading {
  finishedCount: number
  pages: number
}

const EMPTY: MonthReading = { finishedCount: 0, pages: 0 }

/** Libros terminados en un mes y sus páginas, para el calendario de lectura. Sale de
 *  `reading_history` (una fila por lectura completa, relecturas incluidas), igual que el reto
 *  anual. Las páginas suman el total de cada libro terminado ese mes (opción A del plan): Teleo
 *  no guarda cuántas páginas se leen por día. Los audiolibros no suman páginas. */
export function useMonthReading(userId: string | undefined, year: number, month: number) {
  const { data, isLoading } = useCachedQuery<MonthReading>(
    ['monthReading', userId, year, month],
    async () => {
      const first = `${year}-${String(month).padStart(2, '0')}-01`
      const lastDay = new Date(year, month, 0).getDate()
      const last = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
      const { data } = await supabase
        .from('reading_history')
        .select('book_id, books(total_pages)')
        .eq('user_id', userId!)
        .gte('end_date', first)
        .lte('end_date', last)
      const rows = data ?? []
      const pages = rows.reduce((sum, r) => sum + (r.books?.total_pages ?? 0), 0)
      return { finishedCount: rows.length, pages }
    },
    EMPTY,
    { enabled: !!userId }
  )
  return { ...data, isLoading }
}
