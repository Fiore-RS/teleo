import { useState } from 'react'
import { supabase } from '../lib/supabase'

export function useAccountSettings(userId: string | undefined) {
  const [isSaving, setIsSaving] = useState(false)

  async function updateUsername(newUsername: string) {
  if (!userId) return { error: 'No hay usuario' }
  setIsSaving(true)
  const { error } = await supabase.from('profiles').update({ username: newUsername }).eq('id', userId)
  setIsSaving(false)

  if (error?.code === 'P0001') {
    return { error: 'Solo puedes cambiar tu nombre de usuario una vez cada 14 días.' }
  }
  return { error: error?.message ?? null }
}

  async function updateEmail(newEmail: string) {
    setIsSaving(true)
    const { error } = await supabase.auth.updateUser({ email: newEmail })
    setIsSaving(false)
    return { error: error?.message ?? null }
  }

  async function updatePassword(newPassword: string) {
    setIsSaving(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setIsSaving(false)
    return { error: error?.message ?? null }
  }

  return { updateUsername, updateEmail, updatePassword, isSaving }
}