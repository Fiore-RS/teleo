import { useEffect } from 'react'
import { useAuth } from '../../../hooks/useAuth'
import { useProfile } from '../../../hooks/useProfile'
import { refreshAll } from '../../../lib/queryClient'
import { supabase } from '../../../lib/supabase'

/** Espera antes de refrescar, para juntar varios avisos seguidos en un solo refresco. */
const WAIT_MS = 400

/** Cambios en vivo entre dispositivos (V.4.4.0 "Siempre al día"). No dibuja nada.
 *
 *  Escucha el canal privado de la cuenta ('user:<id>'). La base de datos manda ahí un aviso
 *  cada vez que algo cambia en las tablas de la cuenta (migración 0043), venga de este
 *  dispositivo o de otro. Al recibirlo, refresca lo que está en pantalla con `refreshAll()`,
 *  como después de guardar. El tema y el modo se aplican solos al refrescarse el perfil
 *  (PaletteSync y PreferencesSync).
 *
 *  Si se corta la conexión (el teléfono se durmió, se fue internet), al volver se refresca una
 *  vez para recuperar lo que pasó mientras tanto.
 *
 *  La cuenta de visitante no escucha: la comparte todo el mundo y vería al momento lo que
 *  hacen otras personas. */
export function LiveSync() {
  const { user } = useAuth()
  const { profile } = useProfile(user?.id)
  const userId = user?.id
  const ready = !!profile
  const isDemo = !!profile?.is_demo

  useEffect(() => {
    if (!userId || !ready || isDemo) return

    let timer: ReturnType<typeof setTimeout> | undefined
    let joinedBefore = false
    let cancelled = false
    const schedule = () => {
      clearTimeout(timer)
      timer = setTimeout(() => { void refreshAll() }, WAIT_MS)
    }

    const channel = supabase
      .channel(`user:${userId}`, { config: { private: true } })
      .on('broadcast', { event: 'cambio' }, schedule)

    void supabase.realtime.setAuth().then(() => {
      if (cancelled) return
      channel.subscribe((status) => {
        if (status !== 'SUBSCRIBED') return
        if (joinedBefore) schedule()
        joinedBefore = true
      })
    })

    return () => {
      cancelled = true
      clearTimeout(timer)
      void supabase.removeChannel(channel)
    }
  }, [userId, ready, isDemo])

  return null
}
