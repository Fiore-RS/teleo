import { supabase } from '../lib/supabase'
import { queryClient } from '../lib/queryClient'
import { useCachedQuery } from './useCachedQuery'

export interface PeriodFavorite {
  /** 1-12, o null para el favorito del año. */
  month: number | null
  /** null = se eligió "dejar vacío". */
  bookId: string | null
}

const EMPTY: PeriodFavorite[] = []

/** Favoritos por mes y del año (Bitácora > Resumen > Favoritos, migración 0024). Si un mes
 *  no tiene fila, todavía no se eligió nada. */
export function usePeriodFavorites(userId: string | undefined, year: number) {
  const key = ['periodFavorites', userId, year]
  const { data: favorites, isLoading } = useCachedQuery<PeriodFavorite[]>(
    key,
    async () => {
      const { data } = await supabase
        .from('period_favorites')
        .select('month, book_id')
        .eq('user_id', userId!)
        .eq('year', year)
      return (data ?? []).map((row) => ({ month: row.month, bookId: row.book_id }))
    },
    EMPTY,
    { enabled: !!userId }
  )

  /** Guarda el favorito de un mes (o del año con month = null). bookId null = dejar vacío. */
  async function setFavorite(month: number | null, bookId: string | null) {
    if (!userId) return
    // Se actualiza la vista al instante y después se guarda.
    queryClient.setQueryData<PeriodFavorite[]>(key, (prev = []) => [
      ...prev.filter((f) => f.month !== month),
      { month, bookId },
    ])
    await supabase
      .from('period_favorites')
      .upsert(
        { user_id: userId, year, month, book_id: bookId, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,year,month' }
      )
    await queryClient.invalidateQueries({ queryKey: key })
  }

  /** Vuelve a "sin elegir" (borra la fila). */
  async function clearFavorite(month: number | null) {
    if (!userId) return
    queryClient.setQueryData<PeriodFavorite[]>(key, (prev = []) => prev.filter((f) => f.month !== month))
    let query = supabase.from('period_favorites').delete().eq('user_id', userId).eq('year', year)
    query = month === null ? query.is('month', null) : query.eq('month', month)
    await query
    await queryClient.invalidateQueries({ queryKey: key })
  }

  return { favorites, isLoading, setFavorite, clearFavorite }
}
