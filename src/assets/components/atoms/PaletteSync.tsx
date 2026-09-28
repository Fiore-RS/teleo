import { useEffect } from 'react'
import { useAuth } from '../../../hooks/useAuth'
import { useProfile } from '../../../hooks/useProfile'
import { useTheme } from '../../../hooks/useTheme'
import { isPaletteId } from '../../../lib/palettes'

/** El tema de color se guarda en el perfil, para que la cuenta se vea igual en cualquier
 *  dispositivo. Al cargar el perfil, si el tema guardado ahí es otro que el de este
 *  dispositivo, se usa el del perfil. No dibuja nada. */
export function PaletteSync() {
  const { user } = useAuth()
  const { profile } = useProfile(user?.id)
  const { palette, setPalette } = useTheme()
  const saved = profile?.palette

  useEffect(() => {
    if (isPaletteId(saved) && saved !== palette) setPalette(saved)
    // Solo cuando cambia lo guardado en el perfil, no cuando se elige un tema en este
    // dispositivo (eso ya actualiza el perfil a la vez).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saved])

  return null
}
