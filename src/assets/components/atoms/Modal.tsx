import { X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { prefersReducedMotion, EXIT_DURATION_MS } from '../../../lib/motion'
import { Sheet } from './Sheet'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  /** 'dialog' (por defecto): ventana centrada para confirmaciones cortas. 'sheet': hoja
   *  que baja desde arriba, para contenido más largo (buscar libros, filtros, compartir...). */
  variant?: 'dialog' | 'sheet'
}

/** Diálogo centrado para confirmaciones y formularios cortos. Rediseño 2026: esquinas de
 *  28px, título en Fraunces sin itálica y botón redondo para cerrar. Para pantallas de
 *  contenido más largas se usa `Sheet` (hoja que baja desde arriba). */
export function Modal({ isOpen, onClose, title, children, variant = 'dialog' }: ModalProps) {
  const [isClosing, setIsClosing] = useState(false)

  if (!isOpen) {
    // Se reinicia para la próxima vez que se abra (patrón de "ajustar estado al renderizar").
    if (isClosing) setIsClosing(false)
    return null
  }

  // Cerrar desde el propio diálogo (fondo o ✕): animación de salida y luego onClose.
  function requestClose() {
    if (isClosing) return
    if (prefersReducedMotion()) {
      onClose()
      return
    }
    setIsClosing(true)
    setTimeout(onClose, EXIT_DURATION_MS)
  }

  if (variant === 'sheet') {
    return (
      <Sheet onClose={onClose} title={title}>
        {children}
      </Sheet>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" role="dialog" aria-modal="true" aria-label={title}>
      <div className={`absolute inset-0 bg-black/50 ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`} onClick={requestClose} />
      <div className={`relative w-full max-w-sm bg-surface border border-border rounded-[28px] shadow-float p-6 max-h-[90vh] overflow-y-auto ${isClosing ? 'animate-pop-out' : 'animate-pop-in'}`}>
        <div className={`flex items-center gap-3 mb-4 ${title ? 'justify-between' : 'justify-end'}`}>
          {title && <h2 className="font-display font-semibold text-display-md text-text">{title}</h2>}
          <button
            onClick={requestClose}
            aria-label="Cerrar"
            className="w-9 h-9 shrink-0 rounded-full bg-surface-2 border border-border text-text-secondary flex items-center justify-center focus-visible:outline-2 focus-visible:outline-primary-text"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
