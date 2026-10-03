import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { prefersReducedMotion, EXIT_DURATION_MS } from '../../../lib/motion'
import { X } from 'lucide-react'

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
}

/** Hoja del rediseño 2026: baja desde arriba de la pantalla, con esquinas redondeadas abajo,
 *  una "manija" al pie y el título a la izquierda con un botón redondo para cerrar. Se abre
 *  desde arriba (y no desde abajo) para que en el celular el teclado no tape los campos al
 *  escribir. Se usa para pantallas de contenido (detalle de libro, reseña, filtros...); las
 *  confirmaciones cortas siguen siendo diálogos centrados (Modal). Escape también la cierra. */
export function Sheet({ onClose, title, children, headerRight, footer }: SheetProps) {
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

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className={`absolute inset-0 bg-black/50 ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`} onClick={requestClose} />
      <div
        className={`relative w-full max-w-120 max-h-[92vh] flex flex-col bg-surface rounded-b-[28px] shadow-float ${
          isClosing ? 'animate-sheet-out' : 'animate-sheet-down'
        }`}
        // Aire arriba: la zona segura del teléfono (muesca, barra de estado) más 16px, para que
        // el título no quede pegado al borde de la pantalla.
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 16px)' }}
      >
        <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-3 shrink-0">
          <h2 className="font-display font-semibold text-display-md text-text truncate">{title}</h2>
          <div className="flex items-center gap-2 shrink-0">
            {headerRight}
            <button
              type="button"
              onClick={requestClose}
              aria-label="Cerrar"
              className="w-9 h-9 rounded-full bg-surface-2 border border-border text-text-secondary flex items-center justify-center focus-visible:outline-2 focus-visible:outline-primary-text"
            >
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="overflow-y-auto px-5 pb-4 pt-1">{children}</div>
        {footer && (
          <div className="relative shrink-0 px-5 pt-2 pb-1 before:absolute before:inset-x-0 before:-top-6 before:h-6 before:bg-linear-to-t before:from-surface before:to-transparent before:pointer-events-none">
            {footer}
          </div>
        )}
        <div className="pt-1 pb-2.5 flex justify-center shrink-0" aria-hidden="true">
          <span className="w-10 h-1 rounded-full bg-border" />
        </div>
      </div>
    </div>
  )
}
