import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

/** Última sesión conocida (V.4.0.0). Cada pantalla monta su propio useAuth, y antes todas
 *  empezaban sin usuario hasta que Supabase respondía: por un instante no había perfil y la
 *  tapa del cuaderno mostraba "Tu perfil" y la inicial antes de tu nombre y tu foto. Con la
 *  última sesión guardada aquí, las pantallas siguientes arrancan ya con el usuario, y
 *  Supabase igual lo confirma enseguida. undefined = todavía no se sabe. */
let lastKnownUser: User | null | undefined

export function useAuth() {
  const [user, setUser] = useState<User | null>(lastKnownUser ?? null)
  const [isLoading, setIsLoading] = useState(lastKnownUser === undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      lastKnownUser = data.session?.user ?? null
      setUser(lastKnownUser)
      setIsLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      lastKnownUser = session?.user ?? null
      setUser(lastKnownUser)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  return { user, isLoading }
}
