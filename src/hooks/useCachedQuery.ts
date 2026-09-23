import { useCallback, useMemo } from 'react'
import { useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query'

export type Updater<T> = T | ((prev: T) => T)

interface Options<T> {
  /** false mientras falte algo para poder pedir los datos (ej. todavía no hay userId). */
  enabled?: boolean
  /** Datos provisionales mientras llega la primera respuesta (ej. el libro que ya está en la
   *  caché del estante, para abrir su detalle sin esperar). No se guardan en la caché. */
  placeholder?: () => T | undefined
}

/** Envoltorio de TanStack Query con la misma forma que tenían los hooks de datos antes del
 *  caché: devuelve `data`, un `setData` para cambios locales (reordenar, agregar, quitar), un
 *  `isLoading` y `refetch`. Así cada hook conserva su API pública y las pantallas no cambian.
 *
 *  `isLoading` solo es true cuando todavía NO hay nada que mostrar (primera carga): al volver
 *  a una pantalla con datos en caché queda en false aunque se esté refrescando por detrás,
 *  que es justo lo que evita el "instante vacío". */
export function useCachedQuery<T>(key: QueryKey, fetcher: () => Promise<T>, empty: T, options: Options<T> = {}) {
  const queryClient = useQueryClient()
  const enabled = options.enabled ?? true
  const placeholder = options.placeholder
  const query = useQuery<T, Error, T>({
    queryKey: key,
    queryFn: fetcher,
    enabled,
    // Los datos de Teleo nunca son funciones, así que el "NonFunctionGuard" de TanStack no
    // aplica; el cast solo le avisa eso a TypeScript.
    placeholderData: (placeholder ? () => placeholder() : undefined) as never,
  })

  const keyHash = JSON.stringify(key)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableKey = useMemo(() => key, [keyHash])

  const setData = useCallback(
    (updater: Updater<T>) => {
      queryClient.setQueryData<T>(stableKey, (prev) => {
        const base = prev ?? empty
        return typeof updater === 'function' ? (updater as (p: T) => T)(base) : updater
      })
    },
    // `empty` es siempre una constante del módulo que llama.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queryClient, stableKey]
  )

  const { refetch: runRefetch } = query
  const refetch = useCallback(async () => {
    if (!enabled) return
    await runRefetch()
  }, [enabled, runRefetch])

  return { data: query.data ?? empty, setData, isLoading: query.isPending, refetch }
}

/** Setter para un solo campo de un dato compuesto (ej. `books` dentro de `{ saga, books }`),
 *  con la misma firma que el `setX` de un useState. */
export function fieldSetter<T extends object, K extends keyof T>(setData: (u: Updater<T>) => void, field: K) {
  return (updater: Updater<T[K]>) =>
    setData((prev) => ({
      ...prev,
      [field]: typeof updater === 'function' ? (updater as (p: T[K]) => T[K])(prev[field]) : updater,
    }))
}
