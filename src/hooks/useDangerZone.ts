import { useState } from 'react'
import { supabase } from '../lib/supabase'

export function useDangerZone(userId: string | undefined) {
  const [isProcessing, setIsProcessing] = useState(false)

  async function clearAllData() {
    if (!userId) return false
    setIsProcessing(true)
    // Favoritos por periodo: los de libros se borran solos con el libro; esto limpia también
    // los "dejar vacío" (sin libro).
    await supabase.from('period_favorites').delete().eq('user_id', userId)
    await supabase.from('releases').delete().eq('user_id', userId)
    const { error: e1 } = await supabase.from('sagas').delete().eq('user_id', userId)
    const { error: e2 } = await supabase.from('books').delete().eq('user_id', userId)
    setIsProcessing(false)
    return !e1 && !e2
  }

  async function deactivateAccount() {
    if (!userId) return false
    setIsProcessing(true)
    const { error } = await supabase.from('profiles').update({ is_deactivated: true }).eq('id', userId)
    if (!error) await supabase.auth.signOut()
    setIsProcessing(false)
    return !error
  }

  async function deleteAccount() {
    setIsProcessing(true)
    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData.session?.access_token
    if (!token) { setIsProcessing(false); return false }

    const { error } = await supabase.functions.invoke('delete-account', {
      headers: { Authorization: `Bearer ${token}` },
    })
    setIsProcessing(false)
    if (!error) await supabase.auth.signOut()
    return !error
  }

  return { clearAllData, deactivateAccount, deleteAccount, isProcessing }
}