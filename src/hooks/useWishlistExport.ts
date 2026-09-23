import { supabase } from '../lib/supabase'
import type { Database } from '../types/database'
import { useCachedQuery } from './useCachedQuery'

type Book = Database['public']['Tables']['books']['Row']

const EMPTY: Book[] = []

/** Trae TODA la lista de deseados del usuario, sin límite de 6 como useProfileLists (ese
 *  tope existe para vistas de vitrina — Perfil, tarjeta compartible — no para exportar la
 *  lista completa). Alimenta el PDF de "Compartir lista de deseados" en Configuración. */
export function useWishlistExport(userId: string | undefined) {
  const { data: books, isLoading, refetch } = useCachedQuery(
    ['wishlistExport', userId],
    async () => {
      const { data } = await supabase
        .from('books')
        .select('*')
        .eq('user_id', userId!)
        .eq('status', 'deseado')
      return data ?? []
    },
    EMPTY,
    { enabled: !!userId }
  )

  return { books, isLoading, refetch }
}
