import { supabase } from '../lib/supabase'
import type { Database } from '../types/database'
import { useCachedQuery } from './useCachedQuery'

type Profile = Database['public']['Tables']['profiles']['Row']

export function useProfile(userId: string | undefined) {
  const { data: profile, setData: setProfile, isLoading, refetch } = useCachedQuery<Profile | null>(
    ['profile', userId],
    async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId!).single()
      return data ?? null
    },
    null,
    { enabled: !!userId }
  )

  async function updateProfile(updates: Partial<Profile>) {
    if (!userId) return
    const { data, error } = await supabase
      .from('profiles').update(updates).eq('id', userId).select().single()
    if (!error && data) setProfile(data)
  }

  return { profile, isLoading, refetch, updateProfile }
}
