import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database'

type Profile = Database['public']['Tables']['profiles']['Row']

export function useProfileByUsername(username: string | undefined) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!username) return
    setIsLoading(true)
    // ilike en vez de eq: la búsqueda no distingue mayúsculas/minúsculas.
    // El username se guarda tal cual se escribió al registrarse (sin
    // normalizar a minúsculas), así que "@Fiito" y "@fiito" deben
    // encontrar el mismo perfil. Se escapan los comodines de LIKE
    // (%, _, \) para que el username se compare literal, no como patrón.
    const escaped = username.replace(/[\\%_]/g, (c) => `\\${c}`)
    supabase
      .from('profiles')
      .select('*')
      .ilike('username', escaped)
      .maybeSingle()
      .then(({ data }) => {
        setProfile(data ?? null)
        setNotFound(!data)
        setIsLoading(false)
      })
  }, [username])

  return { profile, isLoading, notFound }
}