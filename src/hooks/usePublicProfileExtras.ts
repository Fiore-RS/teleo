import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface PublicExtras {
  pagesRead?: number
  audioSeconds?: number
  finishedCount?: number
  readingCount?: number
  wishlistCount?: number
  abandonedCount?: number
  sagaCount?: number
  reviewCount?: number
  yearsBreakdown?: { year: number; count: number }[]
  longestStreak?: number
  annualGoal?: number
  annualFinishedCount?: number
}

export function usePublicProfileExtras(userId: string | undefined) {
  const [extras, setExtras] = useState<PublicExtras>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    setIsLoading(true)
    supabase
      .rpc('get_public_profile_extras', { target_user_id: userId })
      .then(({ data }) => {
        setExtras((data as PublicExtras) ?? {})
        setIsLoading(false)
      })
  }, [userId])

  return { extras, isLoading }
}