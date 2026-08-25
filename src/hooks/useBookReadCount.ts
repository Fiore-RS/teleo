import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

/** Cuántas veces se ha completado un libro en total — una fila en `reading_history` por
 *  cada vez que se terminó de leer, incluida la primera. Se usa en Detalle del Libro para
 *  mostrar "Leído X veces" cuando ya se releyó al menos una vez (count > 1). */
export function useBookReadCount(bookId: string | undefined) {
  const [count, setCount] = useState(0)

  const refetch = useCallback(async () => {
    if (!bookId) return
    const { count: total } = await supabase
      .from('reading_history')
      .select('*', { count: 'exact', head: true })
      .eq('book_id', bookId)
    setCount(total ?? 0)
  }, [bookId])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { count, refetch }
}
