import { useEffect, useRef, useState } from 'react'
import { MoreVertical, Pencil, ArrowUpDown, BookOpen } from 'lucide-react'

interface PriorityListMenuProps {
  isReordering: boolean
  canReorder: boolean
  canViewInEstante: boolean
  onEditName: () => void
  onToggleReorder: () => void
  onViewInEstante: () => void
}

/** Menú de opciones de "Mi lista de esta temporada" en Mesa — mismo patrón que `StatusMenu`
 *  (botón + panel desplegable que se cierra al tocar afuera), pero como un menú de acciones
 *  en vez de un selector. Reemplaza los tres controles sueltos (lápiz, Organizar, Ver en
 *  Estante) que antes competían por espacio en el header de la sección. */
export function PriorityListMenu({
  isReordering,
  canReorder,
  canViewInEstante,
  onEditName,
  onToggleReorder,
  onViewInEstante,
}: PriorityListMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSelect(action: () => void) {
    setIsOpen(false)
    action()
  }

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        aria-label="Más opciones de la lista"
        className="text-text-secondary"
      >
        <MoreVertical size={18} />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+6px)] z-20 bg-surface border border-border rounded-xl shadow-lg py-1.5 min-w-48 overflow-hidden"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => handleSelect(onEditName)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-body-md font-body text-left text-text hover:bg-bg transition-colors"
          >
            <Pencil size={16} className="text-text-secondary shrink-0" />
            Editar nombre
          </button>

          {canReorder && (
            <button
              type="button"
              role="menuitem"
              onClick={() => handleSelect(onToggleReorder)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-body-md font-body text-left text-text hover:bg-bg transition-colors"
            >
              <ArrowUpDown size={16} className="text-text-secondary shrink-0" />
              {isReordering ? 'Listo' : 'Organizar'}
            </button>
          )}

          {canViewInEstante && (
            <button
              type="button"
              role="menuitem"
              onClick={() => handleSelect(onViewInEstante)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-body-md font-body text-left text-text hover:bg-bg transition-colors"
            >
              <BookOpen size={16} className="text-text-secondary shrink-0" />
              Ver en Estante
            </button>
          )}
        </div>
      )}
    </div>
  )
}
