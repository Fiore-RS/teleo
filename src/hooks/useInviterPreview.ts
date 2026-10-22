import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export interface InviterPreview {
  username: string
  nickname: string | null
  avatar_url: string | null
}

/** Quién invita, a partir del código (V.3.3.0). Usa `inviter_preview` (0035), que funciona sin
 *  sesión y devuelve solo nombre, @ y foto. Si el código no existe o la cuenta está
 *  desactivada, devuelve null y la pantalla se ve como siempre, sin error. */
export function useInviterPreview(code: string | null) {
  const query = useQuery({
    queryKey: ['inviter-preview', code],
    enabled: code !== null,
    staleTime: 10 * 60 * 1000,
    queryFn: async (): Promise<InviterPreview | null> => {
      const { data, error } = await supabase.rpc('inviter_preview', { code: code ?? '' })
      if (error) return null
      return data?.[0] ?? null
    },
  })
  return { inviter: query.data ?? null, isLoading: query.isLoading && code !== null }
}

/** Nombre para mostrar: el nickname si lo hay; si no, el @usuario. */
export function inviterDisplayName(inviter: InviterPreview): string {
  return inviter.nickname?.trim() || inviter.username
}
