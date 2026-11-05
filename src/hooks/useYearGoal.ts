import { supabase } from '../lib/supabase'
import { useCachedQuery } from './useCachedQuery'

/** Meta de libros de un año cualquiera (reading_goals), 0 si no hay (V.3.6.0). La usan el
 *  resumen del año (tarjeta "Mi meta") y Resumen › Año (la postal). useAnnualGoal es solo para
 *  el año en curso y además cuenta los libros. */
export function useYearGoal(userId: string | undefined, year: number, enabled = true) {
  const { data, isLoading } = useCachedQuery<number>(
    ['yearGoal', userId, year],
    async () => {
      const { data: row } = await supabase
        .from('reading_goals')
        .select('goal')
        .eq('user_id', userId!)
        .eq('year', year)
        .maybeSingle()
      return row?.goal ?? 0
    },
    0,
    { enabled: !!userId && enabled }
  )
  return { goal: data, isLoading }
}
