import { supabase } from '../lib/supabase'
import type { Database } from '../types/database'
import { useCachedQuery } from './useCachedQuery'

type Book = Database['public']['Tables']['books']['Row']

export interface ProfileCounts {
  finished: number
  pending: number
  wishlist: number
  abandoned: number
}

interface ProfileLists {
  currentlyReading: Book[]
  favorites: Book[]
  recommended: Book[]
  wishlist: Book[]
  abandoned: Book[]
  counts: ProfileCounts
}

const EMPTY: ProfileLists = {
  currentlyReading: [],
  favorites: [],
  recommended: [],
  wishlist: [],
  abandoned: [],
  counts: { finished: 0, pending: 0, wishlist: 0, abandoned: 0 },
}

// Solo el conteo (sin traer filas) para la fila de números de Perfil.
function countByStatus(userId: string, status: string) {
  return supabase.from('books').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', status)
}

export function useProfileLists(userId: string | undefined) {
  const { data, isLoading, refetch } = useCachedQuery<ProfileLists>(
    ['profileLists', userId],
    async () => {
      const [
        { data: reading },
        { data: favs },
        { data: rec },
        { data: wish },
        { data: aband },
        { count: finishedCount },
        { count: pendingCount },
        { count: wishlistCount },
        { count: abandonedCount },
      ] = await Promise.all([
        supabase.from('books').select('*').eq('user_id', userId!).eq('status', 'leyendo').limit(6),
        supabase.from('books').select('*').eq('user_id', userId!).eq('is_favorite', true).limit(6),
        supabase.from('books').select('*').eq('user_id', userId!).eq('is_recommended', true).limit(6),
        supabase.from('books').select('*').eq('user_id', userId!).eq('status', 'deseado').limit(6),
        supabase.from('books').select('*').eq('user_id', userId!).eq('status', 'abandonado').limit(6),
        countByStatus(userId!, 'terminado'),
        countByStatus(userId!, 'pendiente'),
        countByStatus(userId!, 'deseado'),
        countByStatus(userId!, 'abandonado'),
      ])
      return {
        currentlyReading: reading ?? [],
        favorites: favs ?? [],
        recommended: rec ?? [],
        wishlist: wish ?? [],
        abandoned: aband ?? [],
        counts: {
          finished: finishedCount ?? 0,
          pending: pendingCount ?? 0,
          wishlist: wishlistCount ?? 0,
          abandoned: abandonedCount ?? 0,
        },
      }
    },
    EMPTY,
    { enabled: !!userId }
  )

  return { ...data, isLoading, refetch }
}
