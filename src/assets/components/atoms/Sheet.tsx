import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { prefersReducedMotion, EXIT_DURATION_MS } from '../../../lib/motion'
import { X } from 'lucide-react'
import { useBreakpoint } from '../../../hooks/useBreakpoint'

/** Cuántas hojas hay abiertas. El fondo se bloquea con la primera y se desbloquea al cerrar
 *  la última (V.2.2.1): antes cada hoja guardaba y restauraba el valor anterior, y si dos se
 *  cerraban a la vez (ej. Detalles del libro y el aviso de "Libro eliminado") la pantalla
 *  podía quedar sin poder desplazarse. */
let openSheets = 0
let overflowBeforeSheets = ''

function lockBodyScroll() {
  if (openSheets === 0) {
    overflowBeforeSheets = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }
  openSheets++
}

function unlockBodyScroll() {
  openSheets = Math.max(0, openSheets - 1)
  if (openSheets === 0) document.body.style.overflow = overflowBeforeSheets
}

interface SheetProps {
  onClose: () => void
  title?: string
  children: ReactNode
  /** Botón o acción extra a la izquierda del botón de cerrar. */
  headerRight?: ReactNode
  /** Botones fijos al pie (ej. Cancelar / Guardar): quedan siempre a mano mientras el
   *  contenido se desplaza por detrás, con un degradado que lo deja pasar suave. */
  footer?: ReactNode
  /** Hoja corta (V.4.3.0): en tableta y escritorio es de papel más grueso, como una hoja de
   *  libreta de notas (terminar, pausar, progreso, meta, avisos, cuenta), para distinguirla
   *  cuando sale encima de otra. En el celular (V.4.5.0) también es de papel grueso: el canto
   *  se ve debajo. */
  corta?: boolean
  /** Alto completo en tableta y escritorio (V.4.3.0): para las hojas cuyo contenido cambia
   *  mucho mientras se usan (Detalles del libro y de la saga, Agregar libro, Filtros, Reseña),
   *  así no crecen ni se encogen ni mueven los botones. Las demás miden lo que llevan, hasta el
   *  alto de la pantalla. */
  alta?: boolean
  /** Sigue bajando desde arriba también en pantallas grandes (los anuncios de Novedades). */
  abajo?: boolean
}

/** Renglones de la hoja de detalle. Van en el contenido con `local`, así bajan con el texto. */
const HOJA_LINES =
  'repeating-linear-gradient(180deg, transparent 0 31px, color-mix(in srgb, var(--color-border) 60%, transparent) 31px 32px)'
/** Tamaño de la esquina doblada (arriba a la derecha). */
const HOJA_FOLD = 26
/** Esquina doblada de la hoja del celular (V.4.5.0), abajo a la derecha. */
const HOJA_FOLD_CELULAR = 22
const HOJA_FOLD_ABAJO = `polygon(0 0, 100% 0, 100% calc(100% - ${HOJA_FOLD_CELULAR}px), calc(100% - ${HOJA_FOLD_CELULAR}px) 100%, 0 100%)`

/** Hoja del rediseño 2026. En tableta y escritorio (V.4.3.0) es la hoja de cuaderno de la derecha
 *  (ver `corta` y `abajo`). En el celular baja desde arriba de la pantalla, de lado a lado, y
 *  desde la V.4.5.0 también es hoja de cuaderno: renglones, margen rojo y la esquina doblada
 *  abajo a la derecha (ya sin la "manija" al pie), con el título a la izquierda y un botón para
 *  cerrar. Se abre desde arriba (y no desde abajo) para que en el celular el teclado no tape
 *  los campos al escribir. Escape también la cierra. */
export function Sheet({ onClose, title, children, headerRight, footer, corta = false, alta = false, abajo = false }: SheetProps) {
  const breakpoint = useBreakpoint()
  // V.4.0.0 empezó con Detalles del libro y de la saga; desde la V.4.3.0 todas las hojas son
  // hoja de cuaderno a la derecha en tableta y escritorio (las cortas, del alto de lo que llevan).
  const asHoja = !abajo && breakpoint !== 'celular'
  // Al cerrar desde la propia hoja (fondo, ✕ o Escape) primero se reproduce la animación de
  // salida y después se avisa al padre. Si el padre la cierra por su cuenta (ej. después de
  // guardar), desaparece al instante.
  const [isClosing, setIsClosing] = useState(false)
  const closingRef = useRef(false)
  const requestClose = useCallback(() => {
    if (closingRef.current) return
    closingRef.current = true
    if (prefersReducedMotion()) {
      onClose()
      return
    }
    setIsClosing(true)
    setTimeout(onClose, EXIT_DURATION_MS)
  }, [onClose])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') requestClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [requestClose])

  useEffect(() => {
    lockBodyScroll()
    return unlockBodyScroll
  }, [])

  // Se monta en <body> (V.3.3.0): así ninguna animación de la pantalla de atrás (la aparición
  // escalonada de tarjetas, el deslizamiento de las pantallas secundarias) le cambia la entrada
  // ni la posición, y todas las hojas bajan siempre desde arriba.
  const closeButton = (
    <button
      type="button"
      onClick={requestClose}
      aria-label="Cerrar"
      className="w-9 h-9 rounded-button bg-surface-2 border border-border text-text-secondary flex items-center justify-center hover:text-text focus-visible:outline-2 focus-visible:outline-primary-text"
    >
      <X size={18} />
    </button>
  )

  if (asHoja) {
    return createPortal(
      <div className="fixed inset-0 z-50 flex justify-end p-4 escritorio:p-5" role="dialog" aria-modal="true" aria-label={title}>
        {/* Velo suave: la pantalla de atrás se queda quieta y del mismo tamaño. */}
        <div className={`absolute inset-0 bg-black/35 ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`} onClick={requestClose} />
        {/* La sombra va en un envoltorio: el recorte de la esquina doblada se la comería. */}
        <div
          className={`relative ${alta ? 'h-full' : 'self-start max-h-[calc(100%-6px)] flex flex-col'} ${
            corta ? 'drop-shadow-[0_28px_34px_rgba(0,0,0,0.42)]' : 'drop-shadow-[0_24px_30px_rgba(0,0,0,0.32)]'
          } w-1/2 escritorio:w-[460px] ${isClosing ? 'animate-hoja-out' : 'animate-hoja-in'}`}
        >
          {/* La hoja corta es de papel más grueso, como de libreta de notas (V.4.3.0): el canto se
              ve abajo y a la derecha, así se distingue cuando sale encima de una hoja larga. */}
          {corta && (
            <span
              aria-hidden="true"
              className="absolute inset-0 translate-x-[3px] translate-y-[5px] rounded-[6px] bg-surface-2 border border-border"
              style={{ clipPath: `polygon(0 0, calc(100% - ${HOJA_FOLD}px) 0, 100% ${HOJA_FOLD}px, 100% 100%, 0 100%)` }}
            />
          )}
          <div
            className={`relative ${alta ? 'h-full' : 'min-h-0'} ${corta ? 'border border-border' : ''} flex flex-col bg-surface rounded-[6px] overflow-hidden`}
            style={{ clipPath: `polygon(0 0, calc(100% - ${HOJA_FOLD}px) 0, 100% ${HOJA_FOLD}px, 100% 100%, 0 100%)` }}
          >
            {/* Margen rojo del cuaderno, de arriba abajo. */}
            <span
              aria-hidden="true"
              className="absolute inset-y-0 left-8 w-[1.5px] pointer-events-none z-10"
              style={{ backgroundColor: 'color-mix(in srgb, var(--color-rose) 60%, transparent)' }}
            />
            {/* Esquina doblada. */}
            <span
              aria-hidden="true"
              className="absolute top-0 right-0 z-10"
              style={{
                width: HOJA_FOLD,
                height: HOJA_FOLD,
                background: 'linear-gradient(225deg, transparent 50%, var(--color-surface-2) 50%)',
                boxShadow: '-2px 2px 4px -2px rgba(0,0,0,0.25)',
              }}
            />
            <div className="flex items-center justify-between gap-3 pl-12 pr-10 pt-6 pb-3 shrink-0">
              <h2 className="font-display font-semibold text-display-md text-text truncate">{title}</h2>
              <div className="flex items-center gap-2 shrink-0">
                {headerRight}
                {closeButton}
              </div>
            </div>
            <div
              className={`${alta ? 'flex-1' : 'min-h-0'} overflow-y-auto pl-12 pr-6 pb-5 pt-1`}
              style={{ backgroundImage: HOJA_LINES, backgroundAttachment: 'local' }}
            >
              {children}
            </div>
            {footer && (
              <div className="relative shrink-0 pl-12 pr-6 pt-2 pb-5 bg-surface before:absolute before:inset-x-0 before:-top-6 before:h-6 before:bg-linear-to-t before:from-surface before:to-transparent before:pointer-events-none">
                {footer}
              </div>
            )}
          </div>
        </div>
      </div>,
      document.body,
    )
  }

  // Celular (V.4.5.0): también es hoja de cuaderno (renglones, margen rojo y esquina doblada),
  // pero sigue bajando desde arriba de lado a lado. La esquina doblada va abajo a la derecha,
  // porque arriba está el borde de la pantalla. Las cortas son de papel más grueso: el canto se
  // ve debajo, como en las pantallas grandes.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className={`absolute inset-0 bg-black/50 ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`} onClick={requestClose} />
      {/* La sombra va en un envoltorio: el recorte de la esquina doblada se la comería. */}
      <div
        className={`relative w-full max-w-120 tableta:max-w-[560px] max-h-[92vh] flex flex-col ${
          corta ? 'drop-shadow-[0_22px_26px_rgba(0,0,0,0.42)]' : 'drop-shadow-[0_20px_24px_rgba(0,0,0,0.32)]'
        } ${isClosing ? 'animate-sheet-out' : 'animate-sheet-down'}`}
      >
        {corta && (
          <span
            aria-hidden="true"
            className="absolute inset-0 translate-y-[5px] rounded-b-[16px] bg-surface-2 border border-t-0 border-border"
            style={{ clipPath: HOJA_FOLD_ABAJO }}
          />
        )}
        <div
          className={`relative min-h-0 flex flex-col bg-surface rounded-b-[16px] overflow-hidden ${corta ? 'border-b border-x border-border' : ''}`}
          // Aire arriba: la zona segura del teléfono (muesca, barra de estado) más 16px, para que
          // el título no quede pegado al borde de la pantalla.
          style={{ paddingTop: 'calc(env(safe-area-inset-top) + 16px)', clipPath: HOJA_FOLD_ABAJO }}
        >
          {/* Margen rojo del cuaderno, de arriba abajo. */}
          <span
            aria-hidden="true"
            className="absolute inset-y-0 left-6 w-[1.5px] pointer-events-none z-10"
            style={{ backgroundColor: 'color-mix(in srgb, var(--color-rose) 60%, transparent)' }}
          />
          {/* Esquina doblada, abajo a la derecha. */}
          <span
            aria-hidden="true"
            className="absolute bottom-0 right-0 z-10"
            style={{
              width: HOJA_FOLD_CELULAR,
              height: HOJA_FOLD_CELULAR,
              background: 'linear-gradient(315deg, transparent 50%, var(--color-surface-2) 50%)',
              boxShadow: '-2px -2px 4px -2px rgba(0,0,0,0.25)',
            }}
          />
          <div className="flex items-center justify-between gap-3 pl-10 pr-5 pt-5 pb-3 shrink-0">
            <h2 className="font-display font-semibold text-display-md text-text truncate">{title}</h2>
            <div className="flex items-center gap-2 shrink-0">
              {headerRight}
              {closeButton}
            </div>
          </div>
          <div
            className={`min-h-0 overflow-y-auto pl-10 pr-6 pt-1 ${footer ? 'pb-4' : 'pb-7'}`}
            style={{ backgroundImage: HOJA_LINES, backgroundAttachment: 'local' }}
          >
            {children}
          </div>
          {footer && (
            <div className="relative shrink-0 pl-10 pr-6 pt-2 pb-6 bg-surface before:absolute before:inset-x-0 before:-top-6 before:h-6 before:bg-linear-to-t before:from-surface before:to-transparent before:pointer-events-none">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
