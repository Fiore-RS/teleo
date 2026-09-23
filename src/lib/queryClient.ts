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
