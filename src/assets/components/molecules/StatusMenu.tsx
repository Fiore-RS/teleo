import { createPortal } from 'react-dom'
import { ChevronDown, Check } from 'lucide-react'
import { useFloatingMenu } from '../../../hooks/useFloatingMenu'
import { statusColorVar, statusLabel, type ReadingStatus } from '../../../lib/status'

const ALL_STATUSES: ReadingStatus[] = ['pendiente', 'leyendo', 'terminado', 'abandonado', 'deseado']

interface StatusMenuProps {
  status: ReadingStatus
  onChange: (status: ReadingStatus) => void
  /** Hacia dónde se abre el menú: 'right' (por defecto) lo alinea al borde derecho de la
   *  insignia; 'left' al izquierdo, para cuando la insignia está pegada a la izquierda. */
  align?: 'left' | 'right'
  className?: string
}

/** Insignia de estado clickeable (como en Goodreads): al tocarla se abre un menú en cascada
 *  para cambiar el estado de lectura del libro directamente, sin tener que entrar a "Editar
 *  Libro". Se ve igual que el `Badge` normal, pero es un botón con un menú desplegable.
 *  El menú se dibuja en un portal (`useFloatingMenu`, V.2.2.1) para que no lo recorten las hojas. */
export function StatusMenu({ status, onChange, align = 'right', className = '' }: StatusMenuProps) {
  const { isOpen, toggle, close, containerRef, anchorRef, menuRef, menuStyle } = useFloatingMenu({ align })

  function handleSelect(newStatus: ReadingStatus) {
    close()
    if (newStatus !== status) onChange(newStatus)
  }

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      <button
        ref={anchorRef}
        type="button"
        onClick={toggle}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Cambiar estado de lectura"
        className="inline-flex items-center gap-1.5 pl-4 pr-3 py-1.5 rounded-full text-body-sm font-body font-bold transition-opacity active:opacity-80"
        style={{ backgroundColor: statusColorVar[status], color: 'var(--color-surface)' }}
      >
        {statusLabel[status]}
        <ChevronDown size={15} className={`shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && createPortal(
        <div
          ref={menuRef}
          role="listbox"
          style={menuStyle}
          className="z-70 bg-surface border border-border rounded-2xl shadow-float py-1.5 min-w-40 overflow-y-auto animate-pop-in"
        >
          {ALL_STATUSES.map((s) => {
            const isSelected = s === status
            return (
              <button
                key={s}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(s)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-body-md font-body text-left transition-colors ${
                  isSelected ? 'bg-primary-soft/60' : 'hover:bg-surface-2'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: statusColorVar[s] }} />
                <span className="flex-1 text-text truncate">{statusLabel[s]}</span>
                {isSelected && <Check size={14} className="text-primary-text shrink-0" />}
              </button>
            )
          })}
        </div>,
        document.body,
      )}
    </div>
  )
}
