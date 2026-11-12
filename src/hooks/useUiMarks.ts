import { useCallback, useReducer } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Database, Json } from '../types/database'
import { mergeUiMarks, parseUiMarks, readLocalUiMarks, writeLocalUiMarks, type UiMarks } from '../lib/uiMarks'
import { useAuth } from './useAuth'
import { useProfile } from './useProfile'

type Profile = Database['public']['Tables']['profiles']['Row']

/** Marcas de la app guardadas en la cuenta (ver lib/uiMarks.ts).
 *
 *  `ready` es false mientras no haya perfil: hasta entonces no se sabe qué vio la persona, así
 *  que las pantallas no deben mostrar nada que dependa de una marca.
 *
 *  `patchMarks` muestra el cambio enseguida en la caché del perfil y después lo junta en la
 *  base con merge_ui_marks (0041), que devuelve las marcas como quedaron. En la cuenta de
 *  visitante se guarda en el dispositivo. */
export function useUiMarks() {
  const { user } = useAuth()
  const userId = user?.id
  const { profile } = useProfile(userId)
  const queryClient = useQueryClient()
  // La cuenta de visitante lee del dispositivo: este contador vuelve a dibujar tras un cambio.
  const [, bumpLocal] = useReducer((n: number) => n + 1, 0)

  const isDemo = !!profile?.is_demo
  const ready = !!userId && !!profile
  const marks: UiMarks = !ready ? {} : isDemo ? readLocalUiMarks(userId) : parseUiMarks(profile.ui_marks)

  const patchMarks = useCallback(
    async (patch: UiMarks) => {
      if (!userId || !profile) return
      if (profile.is_demo) {
        writeLocalUiMarks(userId, mergeUiMarks(readLocalUiMarks(userId), patch))
        bumpLocal()
        return
      }
      const key = ['profile', userId]
      const setMarks = (next: (prev: UiMarks) => UiMarks) =>
        queryClient.setQueryData<Profile | null>(key, (prev) =>
          prev ? { ...prev, ui_marks: next(parseUiMarks(prev.ui_marks)) as Json } : prev
        )
      setMarks((prev) => mergeUiMarks(prev, patch))
      const { data, error } = await supabase.rpc('merge_ui_marks', { patch: patch as Json })
      if (!error && data) setMarks(() => parseUiMarks(data))
    },
    [userId, profile, queryClient]
  )

  return { marks, ready, patchMarks }
}
