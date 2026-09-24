import { supabase } from '../lib/supabase'
import { queryClient } from '../lib/queryClient'
import { useCachedQuery } from './useCachedQuery'
import type { Database } from '../types/database'

export type Release = Database['public']['Tables']['releases']['Row']
export type ReleaseInput = Pick<Release, 'title' | 'author' | 'release_date' | 'place' | 'price' | 'book_id'>

const EMPTY: Release[] = []

/** Lanzamientos de la usuaria (fase 7), ordenados por fecha. Los usan la pantalla
 *  Lanzamientos, la tarjeta de Mesa y el detalle de un libro deseado. */
export function useReleases(userId: string | undefined) {
  const key = ['releases', userId]
  const { data: releases, isLoading } = useCachedQuery<Release[]>(
    key,
    async () => {
      const { data } = await supabase
        .from('releases')
        .select('*')
        .eq('user_id', userId!)
        .order('release_date', { ascending: true })
        .order('created_at', { ascending: true })
      return data ?? []
    },
    EMPTY,
    { enabled: !!userId }
  )

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ['releases'] })
  }

  async function addRelease(input: ReleaseInput) {
    const { error } = await supabase.from('releases').insert({ ...input, user_id: userId! })
    await refresh()
    return !error
  }

  async function updateRelease(id: string, input: ReleaseInput) {
    const { error } = await supabase.from('releases').update(input).eq('id', id)
    await refresh()
    return !error
  }

  async function deleteRelease(id: string) {
    const { error } = await supabase.from('releases').delete().eq('id', id)
    await refresh()
    return !error
  }

  return { releases, isLoading, addRelease, updateRelease, deleteRelease }
}
