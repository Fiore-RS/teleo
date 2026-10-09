import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './useAuth'
import { useProfile } from './useProfile'
import { LATEST_VERSION, markChangelogSeen } from '../lib/changelog'

/** Cierra la bienvenida de una cuenta nueva y lleva a La mesa. Lo usan "Empezar a leer" en
 *  Bienvenida y "Listo" al final del Tutorial cuando se abre desde ahí. */
export function useFinishIntro() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { updateProfile } = useProfile(user?.id)
  const [isSaving, setIsSaving] = useState(false)

  async function finishIntro() {
    setIsSaving(true)
    // Las cuentas nuevas no ven el anuncio de novedades: todo es nuevo para ellas.
    await updateProfile({ has_seen_intro: true, last_seen_version: LATEST_VERSION })
    markChangelogSeen()
    setIsSaving(false)
    navigate('/mesa', { replace: true })
  }

  return { finishIntro, isSaving }
}
