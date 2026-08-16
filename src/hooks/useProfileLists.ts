import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database'

type Book = Database['public']['Tables']['books']['Row']

export function useProfileLists(userId: string | undefined) {
  const [currentlyReading, setCurrentlyReading] = useState<Book[]>([])
  const [favorites, setFavorites] = useState<Book[]>([])
  const [recommended, setRecommended] = useState<Book[]>([])
  const [wishlist, setWishlist] = useState<Book[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!userId) return
    setIsLoading(true)

    const [{ data: reading }, { data: favs }, { data: rec }, { data: wish }] = await Promise.all([
      supabase.from('books').select('*').eq('user_id', userId).eq('status', 'leyendo').limit(6),
      supabase.from('books').select('*').eq('user_id', userId).eq('is_favorite', true).limit(6),
      supabase.from('books').select('*').eq('user_id', userId).eq('is_recommended', true).limit(6),
      supabase.from('books').select('*').eq('user_id', userId).eq('status', 'deseado').limit(6),
    ])

    setCurrentlyReading(reading ?? [])
    setFavorites(favs ?? [])
    setRecommended(rec ?? [])
    setWishlist(wish ?? [])
    setIsLoading(false)
  }, [userId])

  useEffect(() => { refetch() }, [refetch])

  return { currentlyReading, favorites, recommended, wishlist, isLoading, refetch }
}