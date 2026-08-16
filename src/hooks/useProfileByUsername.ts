import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database'

type Profile = Database['public']['Tables']['profiles']['Row']

export function useProfileByUsername(username: string | undefined) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!username) return
    setIsLoading(true)
    supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .maybeSingle()
      .then(({ data }) => {
        setProfile(data ?? null)
        setNotFound(!data)
        setIsLoading(false)
      })
  }, [username])

  return { profile, isLoading, notFound }
}