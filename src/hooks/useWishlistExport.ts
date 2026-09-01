import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database'

type Book = Database['public']['Tables']['books']['Row']

/** Trae TODA la lista de deseados del usuario, sin límite de 6 como useProfileLists (ese
 *  tope existe para vistas de vitrina — Perfil, tarjeta compartible — no para exportar la
 *  lista completa). Alimenta el PDF de "Compartir lista de deseados" en Configuración. */
export function useWishlistExport(userId: string | undefined) {
  const [books, setBooks] = useState<Book[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!userId) return
    setIsLoading(true)
    const { data } = await supabase
      .from('books')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'deseado')

    setBooks(data ?? [])
    setIsLoading(false)
  }, [userId])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { books, isLoading, refetch }
}
