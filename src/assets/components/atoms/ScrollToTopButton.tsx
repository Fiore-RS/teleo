import { ArrowUp } from 'lucide-react'

/** Botón flotante "volver arriba", pensado para pantallas largas como Estante y
 *  Cuaderno. Se ancla a la misma columna centrada que usa TabBar (mismo truco de
 *  `left-1/2 -translate-x-1/2 max-w-120`) para que quede alineado en pantallas anchas.
 *  Siempre visible (no depende del scroll — ver nota más abajo).
 *
 *  Importante: la posición NO se calcula con `calc(Xrem + env(safe-area-inset-bottom))`
 *  en la propiedad `bottom` del botón. Si `env()` no resuelve en el navegador/dispositivo
 *  (webview, navegador más viejo, etc.), un calc() inválido invalida TODA la declaración
 *  y `bottom` cae a su valor inicial (`auto`) — un elemento `fixed` con `bottom: auto`
 *  deja de estar anclado y pasa a ubicarse en su posición normal dentro del flujo del
 *  documento, justo donde está en el JSX (después de la grilla de libros/sagas). Con
 *  pocos libros esa posición cae cerca del fondo de la pantalla por coincidencia; con
 *  muchos libros queda muy por debajo, y hay que scrollear hasta el final para verlo —
 *  esto es justo lo que reportó Fiorella ("desaparece con muchos libros"). Por eso acá
 *  el safe-area se aplica aparte, como padding en el contenedor (mismo truco que usa
 *  TabBar), y el `bottom` del botón queda como un valor fijo simple. */
export function ScrollToTopButton() {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-30 pointer-events-none"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="relative mx-auto w-full max-w-120">
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Volver arriba"
          className="pointer-events-auto absolute right-4 bottom-20 w-11 h-11 rounded-full bg-state-pending text-surface flex items-center justify-center drop-shadow-md active:opacity-80 transition-opacity"
        >
          <ArrowUp size={20} />
        </button>
      </div>
    </div>
  )
}
