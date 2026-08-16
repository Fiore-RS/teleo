import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database'

type Profile = Database['public']['Tables']['profiles']['Row']

export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!userId) return
    setIsLoading(true)
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    setProfile(data ?? null)
    setIsLoading(false)
  }, [userId])

  useEffect(() => { refetch() }, [refetch])

  async function updateProfile(updates: Partial<Profile>) {
    if (!userId) return
    const { data, error } = await supabase
      .from('profiles').update(updates).eq('id', userId).select().single()
    if (!error && data) setProfile(data)
  }

  return { profile, isLoading, refetch, updateProfile }
}