import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database'
import { computeMidpointOrder } from '../lib/reorder'

type Saga = Database['public']['Tables']['sagas']['Row']
export type SagaWithCovers = Saga & { covers: [string?, string?, string?]; bookCount: number }

export function useLibrarySagas(userId: string | undefined) {
  const [sagas, setSagas] = useState<SagaWithCovers[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!userId) return
    setIsLoading(true)

    const { data: sagaRows } = await supabase
      .from('sagas')
      .select('*')
      .eq('user_id', userId)
      .order('estante_sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    const rows = sagaRows ?? []

    // Auto-reparación: sagas creadas antes de este fix (o restauradas desde una copia de
    // seguridad importada) pueden haber quedado con estante_sort_order null. Con varias
    // sagas en null el cálculo de posición al reordenar no tiene de dónde partir y el
    // drag and drop se siente roto (ej. solo deja mover en una dirección). Postgres ya las
    // ordena al final (NULLS LAST), así que apenas detectamos alguna sin orden le asignamos
    // uno válido y consecutivo — sin esperar a que se aplique una migración manual.
    const missingOrder = rows.filter((s) => s.estante_sort_order === null)
    if (missingOrder.length > 0) {
      let nextOrder = rows.reduce((max, s) => Math.max(max, s.estante_sort_order ?? 0), 0) + 1000
      for (const saga of missingOrder) {
        saga.estante_sort_order = nextOrder
        await supabase.from('sagas').update({ estante_sort_order: nextOrder }).eq('id', saga.id)
        nextOrder += 1000
      }
    }

    const withCovers = await Promise.all(
      rows.map(async (saga) => {
        const [{ data: books }, { count }] = await Promise.all([
          supabase
            .from('books')
            .select('cover_url')
            .eq('saga_id', saga.id)
            .order('saga_sort_order', { ascending: true })
            .limit(3),
          supabase
            .from('books')
            .select('*', { count: 'exact', head: true })
            .eq('saga_id', saga.id),
        ])

        const covers = (books ?? []).map((b) => b.cover_url ?? undefined)
        return {
          ...saga,
          covers: [covers[0], covers[1], covers[2]] as [string?, string?, string?],
          bookCount: count ?? 0,
        }
      })
    )

    setSagas(withCovers)
    setIsLoading(false)
  }, [userId])

  useEffect(() => {
    refetch()
  }, [refetch])

  async function reorderSaga(sagaId: string, beforeId: string | null, afterId: string | null) {
    const beforeOrder = beforeId ? sagas.find((s) => s.id === beforeId)?.estante_sort_order ?? null : null
    const afterOrder = afterId ? sagas.find((s) => s.id === afterId)?.estante_sort_order ?? null : null
    const newOrder = computeMidpointOrder(beforeOrder, afterOrder)

    setSagas((prev) =>
      prev
        .map((s) => (s.id === sagaId ? { ...s, estante_sort_order: newOrder } : s))
        .sort((a, b) => (a.estante_sort_order ?? 0) - (b.estante_sort_order ?? 0))
    )

    await supabase.from('sagas').update({ estante_sort_order: newOrder }).eq('id', sagaId)
  }

  return { sagas, isLoading, refetch, reorderSaga }
}