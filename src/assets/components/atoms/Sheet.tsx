import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { prefersReducedMotion, EXIT_DURATION_MS } from '../../../lib/motion'
import { X } from 'lucide-react'

interface SheetProps {
  onClose: () => void
  title?: string
  children: ReactNode
  /** Botón o acción extra a la izquierda del botón de cerrar. */
  headerRight?: ReactNode
}

/** Hoja del rediseño 2026: baja desde arriba de la pantalla, con esquinas redondeadas abajo,
 *  una "manija" al pie y el título a la izquierda con un botón redondo para cerrar. Se abre
 *  desde arriba (y no desde abajo) para que en el celular el teclado no tape los campos al
 *  escribir. Se usa para pantallas de contenido (detalle de libro, reseña, filtros...); las
 *  confirmaciones cortas siguen siendo diálogos centrados (Modal). Escape también la cierra. */
export function Sheet({ onClose, title, children, headerRight }: SheetProps) {
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
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = prevOverflow
    }
  }, [requestClose])

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className={`absolute inset-0 bg-black/50 ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`} onClick={requestClose} />
      <div
        className={`relative w-full max-w-120 max-h-[92vh] flex flex-col bg-surface rounded-b-[28px] shadow-float ${
          isClosing ? 'animate-sheet-out' : 'animate-sheet-down'
        }`}
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
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
        <div className="pt-1 pb-2.5 flex justify-center shrink-0" aria-hidden="true">
          <span className="w-10 h-1 rounded-full bg-border" />
        </div>
      </div>
    </div>
  )
}
