import { supabase } from '../lib/supabase'
import { useCachedQuery } from './useCachedQuery'
import { useReadingAmounts } from './useReadingAmounts'

/** Libros terminados en un mes y las páginas leídas ese mes, para el calendario de lectura. Los
 *  libros salen de `reading_history` (una fila por lectura completa, relecturas incluidas), igual
 *  que el reto anual. V.4.6.0: las páginas son las que se avanzaron en el mes (lib/
 *  readingAmounts.ts), no el total de los libros terminados; los audiolibros no suman páginas. */
export function useMonthReading(userId: string | undefined, year: number, month: number) {
  const first = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const last = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  const { data: finishedCount, isLoading } = useCachedQuery<number>(
    ['monthReading', userId, year, month],
    async () => {
      const { count } = await supabase
        .from('reading_history')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId!)
        .gte('end_date', first)
        .lte('end_date', last)
      return count ?? 0
    },
    0,
    { enabled: !!userId }
  )
  const { between, isLoading: amountsLoading } = useReadingAmounts(userId)
  return { finishedCount, pages: between(first, last).pages, isLoading: isLoading || amountsLoading }
}
