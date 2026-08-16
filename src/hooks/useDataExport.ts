import { useState } from 'react'
import { supabase } from '../lib/supabase'

export function useDataExport(userId: string | undefined) {
  const [isExporting, setIsExporting] = useState(false)

  async function exportData() {
    if (!userId) return false
    setIsExporting(true)

    const [{ data: books }, { data: sagas }, { data: reviews }, { data: profile }] = await Promise.all([
      supabase.from('books').select('*').eq('user_id', userId),
      supabase.from('sagas').select('*').eq('user_id', userId),
      supabase.from('reviews').select('*, custom_ratings(*), favorite_quotes(*)').eq('user_id', userId),
      supabase.from('profiles').select('*').eq('id', userId).single(),
    ])

    const exportPayload = {
      exportedAt: new Date().toISOString(),
      profile, books, sagas, reviews,
    }

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `teleo-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)

    setIsExporting(false)
    return true
  }

  return { exportData, isExporting }
}