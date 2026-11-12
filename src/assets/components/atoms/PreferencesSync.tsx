import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../../hooks/useAuth'
import { useProfile } from '../../../hooks/useProfile'
import { useTheme } from '../../../hooks/useTheme'
import { supabase } from '../../../lib/supabase'
import type { Json } from '../../../types/database'
import type { Theme } from '../../../context/themeContextValue'
import {
  collectLegacyUiMarks,
  hasMarks,
  markLocalPrefsUploaded,
  parseUiMarks,
  wereLocalPrefsUploaded,
} from '../../../lib/uiMarks'

const isTheme = (v: unknown): v is Theme => v === 'light' || v === 'dark' || v === 'system'

/** Para que una subida no corra dos veces a la vez (StrictMode, o el perfil que se vuelve a
 *  pedir mientras sube). */
let uploading = false

/** Preferencias en la cuenta (V.3.7.2). No dibuja nada.
 *
 *  1. Modo: igual que el tema con PaletteSync. Si el modo guardado en la cuenta es otro que el
 *     de este dispositivo, se usa el de la cuenta. Elegir un modo en Configuración lo guarda en
 *     los dos (ThemeToggle).
 *  2. Subida única: la primera vez que este dispositivo abre la 3.7.2, sube lo que tenía
 *     guardado (marcas y modo) para que no se pierda con la mudanza a teleo.fiorers.dev. Las
 *     marcas se juntan con las de la cuenta; el modo solo se sube si la cuenta todavía no
 *     tiene uno (el primer dispositivo manda).
 *
 *  La cuenta de visitante no sube nada: la comparte todo el mundo. */
export function PreferencesSync() {
  const { user } = useAuth()
  const { profile } = useProfile(user?.id)
  const { theme, setTheme } = useTheme()
  const queryClient = useQueryClient()
  const isDemo = !!profile?.is_demo
  const savedMode = isDemo ? undefined : profile?.theme_mode

  useEffect(() => {
    if (isTheme(savedMode) && savedMode !== theme) setTheme(savedMode)
    // Solo cuando cambia lo guardado en la cuenta, no cuando se elige un modo en este
    // dispositivo (eso ya actualiza la cuenta a la vez).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedMode])

  const userId = user?.id
  const hasProfile = !!profile
  useEffect(() => {
    if (!userId || !profile || profile.is_demo || uploading || wereLocalPrefsUploaded(userId)) return
    uploading = true
    const patch = collectLegacyUiMarks(userId, parseUiMarks(profile.ui_marks))
    const modeToUpload = profile.theme_mode == null ? theme : null

    async function upload() {
      if (hasMarks(patch)) {
        const { error } = await supabase.rpc('merge_ui_marks', { patch: patch as Json })
        if (error) return false
      }
      if (modeToUpload) {
        const { error } = await supabase
          .from('profiles')
          .update({ theme_mode: modeToUpload })
          .eq('id', userId!)
          .is('theme_mode', null)
        if (error) return false
      }
      return true
    }

    upload()
      .then((ok) => {
        // Si algo falló, se vuelve a intentar la próxima vez que se abra Teleo.
        if (!ok) return
        markLocalPrefsUploaded(userId)
        if (hasMarks(patch) || modeToUpload) void queryClient.invalidateQueries({ queryKey: ['profile', userId] })
      })
      .finally(() => {
        uploading = false
      })
    // Corre cuando hay sesión y perfil; lo demás se lee en ese momento.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, hasProfile])

  return null
}
