import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { refreshAll } from '../lib/queryClient'
import { useCachedQuery } from './useCachedQuery'

/** Libros físicos (o sin formato, que Teleo trata como físicos) que no están en Deseados y
 *  todavía no tienen "Lo tengo" (V.3.7.0). Los usa la hoja que ofrece marcarlos todos de una
 *  vez, en Mesa y desde Configuración. */
function unownedPhysical(userId: string) {
  return supabase
    .from('books')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .neq('status', 'deseado')
    .eq('owned', false)
    .or('format.eq.fisico,format.is.null')
}

export function useUnownedPhysical(userId: string | undefined, enabled = true) {
  const [isMarking, setIsMarking] = useState(false)
  const { data: count, isLoading } = useCachedQuery<number>(
    ['unownedPhysical', userId],
    async () => {
      const { count: total } = await unownedPhysical(userId!)
      return total ?? 0
    },
    0,
    { enabled: !!userId && enabled }
  )

  async function markAll() {
    if (!userId) return
    setIsMarking(true)
    await supabase
      .from('books')
      .update({ owned: true })
      .eq('user_id', userId)
      .neq('status', 'deseado')
      .eq('owned', false)
      .or('format.eq.fisico,format.is.null')
    await refreshAll()
    setIsMarking(false)
  }

  return { count, isLoading, isMarking, markAll }
}
