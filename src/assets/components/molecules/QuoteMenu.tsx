import { useEffect, useRef, useState } from 'react'
import { MoreHorizontal, Share2, BookOpen, Pencil, Trash2, type LucideIcon } from 'lucide-react'

interface QuoteMenuProps {
  /** Hacia dónde se abre el panel: en la columna izquierda de Mis citas se abre hacia la
   *  derecha, para que no se salga de la pantalla. */
  align?: 'left' | 'right'
  /** Tamaño del botón: 'sm' en las tarjetas de dos columnas, 'md' en la cita al azar. */
  size?: 'sm' | 'md'
  /** Avisa cuando se abre o se cierra, para subir la tarjeta encima de las de abajo. */
  onOpenChange?: (isOpen: boolean) => void
  onShare: () => void
  onOpenReview: () => void
  onEdit: () => void
  onDelete: () => void
}

// Alto aproximado del panel (4 opciones) y espacio que ocupan abajo la barra de pestañas y el
// botón de volver arriba. Si abajo no cabe, el panel se abre hacia arriba.
const MENU_HEIGHT = 200
const BOTTOM_RESERVED = 120

/** Menú de opciones de una cita en Mis citas (V.2.1.1): Compartir, Ver reseña, Editar y
 *  Eliminar. Mismo patrón que `PriorityListMenu` (botón + panel que se cierra al tocar
 *  afuera). */
export function QuoteMenu({ align = 'right', size = 'sm', onOpenChange, onShare, onOpenReview, onEdit, onDelete }: QuoteMenuProps) {
  const [isOpen, setIsOpenState] = useState(false)
  const [opensUp, setOpensUp] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  function setIsOpen(next: boolean) {
    if (next && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom - BOTTOM_RESERVED
      setOpensUp(spaceBelow < MENU_HEIGHT && rect.top > MENU_HEIGHT)
    }
    setIsOpenState(next)
    onOpenChange?.(next)
  }

  useEffect(() => {
    if (!isOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpenState(false)
        onOpenChange?.(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onOpenChange])

  function handleSelect(action: () => void) {
    setIsOpen(false)
    action()
  }

  const items: { label: string; icon: LucideIcon; action: () => void; danger?: boolean }[] = [
    { label: 'Compartir', icon: Share2, action: onShare },
    { label: 'Ver reseña', icon: BookOpen, action: onOpenReview },
    { label: 'Editar', icon: Pencil, action: onEdit },
    { label: 'Eliminar', icon: Trash2, action: onDelete, danger: true },
  ]

  return (
    <div className="relative shrink-0" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Opciones de la cita"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className={`${size === 'md' ? 'w-9 h-9' : 'w-8 h-8'} rounded-full bg-primary-soft text-primary-text flex items-center justify-center focus-visible:outline-2 focus-visible:outline-primary-text`}
      >
        <MoreHorizontal size={size === 'md' ? 18 : 16} />
      </button>

      {isOpen && (
        <div
          role="menu"
          className={`absolute ${align === 'left' ? 'left-0' : 'right-0'} ${opensUp ? 'bottom-[calc(100%+6px)]' : 'top-[calc(100%+6px)]'} z-30 bg-surface border border-border rounded-2xl shadow-float py-1.5 min-w-40 overflow-hidden animate-pop-in`}
        >
          {items.map(({ label, icon: Icon, action, danger }) => (
            <button
              key={label}
              type="button"
              role="menuitem"
              onClick={() => handleSelect(action)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-body-md font-body text-left hover:bg-surface-2 transition-colors ${danger ? 'text-primary-text' : 'text-text'}`}
            >
              <Icon size={16} className={`shrink-0 ${danger ? 'text-primary-text' : 'text-text-secondary'}`} />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
