import { QueryClient } from '@tanstack/react-query'

/** Caché compartida de datos de Supabase (rediseño 2026).
 *
 *  Cómo se comporta:
 *  - La primera vez que una pantalla pide algo, se carga normal (y se muestran esqueletos).
 *  - Al volver a esa pantalla, se muestra al instante lo que ya estaba en caché y, por
 *    detrás, se vuelve a pedir a Supabase (staleTime 0): si algo cambió se reemplaza solo.
 *  - Los datos se guardan 30 minutos después de dejar de usarse (gcTime).
 *  - Al volver a la app (foco de la ventana) también se refrescan.
 *  - Al cerrar sesión se vacía todo (ver main.tsx). */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      gcTime: 30 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
})

/** Refresca toda la app después de guardar algo (V.3.6.0, "cambios en vivo").
 *
 *  Marca todos los datos en caché como desactualizados y vuelve a pedir a Supabase solo los
 *  que están en pantalla en ese momento; los demás se piden al volver a su pantalla. Así,
 *  por ejemplo, terminar un libro desde La mesa actualiza al instante la meta anual, que
 *  vive en otra consulta de la misma pantalla. Es liviano: en una pantalla hay pocas
 *  consultas a la vez.
 *
 *  Usar después de cada cambio que se guarda en Supabase. No hace falta en los cambios
 *  locales al reordenar (ahí ya se actualizó la vista al instante con `setData`). */
export function refreshAll() {
  return queryClient.invalidateQueries()
}
