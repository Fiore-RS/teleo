import { supabase } from '../lib/supabase'
import type { Database } from '../types/database'
import { useCachedQuery } from './useCachedQuery'

type Book = Database['public']['Tables']['books']['Row']

interface ProfileLists {
  currentlyReading: Book[]
  favorites: Book[]
  recommended: Book[]
  wishlist: Book[]
}

const EMPTY: ProfileLists = { currentlyReading: [], favorites: [], recommended: [], wishlist: [] }

export function useProfileLists(userId: string | undefined) {
  const { data, isLoading, refetch } = useCachedQuery<ProfileLists>(
    ['profileLists', userId],
    async () => {
      const [{ data: reading }, { data: favs }, { data: rec }, { data: wish }] = await Promise.all([
        supabase.from('books').select('*').eq('user_id', userId!).eq('status', 'leyendo').limit(6),
        supabase.from('books').select('*').eq('user_id', userId!).eq('is_favorite', true).limit(6),
        supabase.from('books').select('*').eq('user_id', userId!).eq('is_recommended', true).limit(6),
        supabase.from('books').select('*').eq('user_id', userId!).eq('status', 'deseado').limit(6),
      ])
      return {
        currentlyReading: reading ?? [],
        favorites: favs ?? [],
        recommended: rec ?? [],
        wishlist: wish ?? [],
      }
    },
    EMPTY,
    { enabled: !!userId }
  )

  return { ...data, isLoading, refetch }
}
