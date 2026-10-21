import { useState } from 'react'
import { USERNAME_COOLDOWN_DAYS } from '../lib/usernameCooldown'
import { supabase } from '../lib/supabase'
import { authErrorMessage } from '../lib/authErrors'
import { getUsernameIssue, usernameIssueMessage, usernameTakenMessage } from '../lib/username'

export function useAccountSettings(userId: string | undefined) {
  const [isSaving, setIsSaving] = useState(false)

  async function updateUsername(newUsername: string) {
    if (!userId) return { error: 'No hay usuario' }
    const issue = getUsernameIssue(newUsername)
    if (issue) return { error: usernameIssueMessage(issue) }

    setIsSaving(true)
    const { error } = await supabase.from('profiles').update({ username: newUsername }).eq('id', userId)
    setIsSaving(false)

    if (!error) return { error: null }
    // 23505: el índice único de lower(username) (0035). P0001: los triggers de la espera de
    // 7 días (0023) y del formato (0035); se distinguen por su mensaje, que es nuestro.
    if (error.code === '23505') return { error: usernameTakenMessage(newUsername) }
    if (error.code === 'P0001' && error.message.includes('una vez cada')) {
      return { error: `Solo puedes cambiar tu nombre de usuario una vez cada ${USERNAME_COOLDOWN_DAYS} días.` }
    }
    if (error.code === 'P0001') return { error: usernameIssueMessage('chars') }
    return { error: 'No se pudo cambiar el nombre de usuario. Inténtalo de nuevo.' }
  }

  async function updateEmail(newEmail: string) {
    setIsSaving(true)
    const { error } = await supabase.auth.updateUser({ email: newEmail })
    setIsSaving(false)
    return { error: error ? authErrorMessage(error, 'changeEmail') : null }
  }

  async function updatePassword(newPassword: string) {
    setIsSaving(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setIsSaving(false)
    return { error: error ? authErrorMessage(error, 'changePassword') : null }
  }

  return { updateUsername, updateEmail, updatePassword, isSaving }
}