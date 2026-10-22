import { useEffect, useRef, useState } from 'react'
import { MoreHorizontal, Pencil, ArrowUpDown, BookOpen, BookPlus, Shuffle } from 'lucide-react'

interface PriorityListMenuProps {
  isReordering: boolean
  canReorder: boolean
  canViewInEstante: boolean
  /** "Elegir uno al azar" (V.3.2.1): solo con 2 libros o más en la lista. */
  canPickRandom: boolean
  /** "Agregar libros" (V.3.3.0): abre la hoja para marcar y desmarcar pendientes. */
  onAddBooks: () => void
  onEditName: () => void
  onToggleReorder: () => void
  onViewInEstante: () => void
  onPickRandom: () => void
}

/** Menú de opciones de "Mis próximas lecturas" (Perfil), con el mismo patrón que `StatusMenu`
 *  (botón + panel desplegable que se cierra al tocar afuera), pero como un menú de acciones
 *  en vez de un selector. Reemplaza los tres controles sueltos (lápiz, Organizar, Ver en
 *  Estante) que antes competían por espacio en el header de la sección. */
export function PriorityListMenu({
  isReordering,
  canReorder,
  canViewInEstante,
  canPickRandom,
  onAddBooks,
  onEditName,
  onToggleReorder,
  onViewInEstante,
  onPickRandom,
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
      {/* V.3.2.1: solo el ícono, en el color de la pestaña y del alto de "Ver todos". El círculo
          de 34px era más alto que el espacio de la pestaña y se comía la esquina de la tarjeta. */}
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        aria-label="Más opciones de la lista"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="w-9 h-7 rounded-full text-current flex items-center justify-center focus-visible:outline-2 focus-visible:outline-primary-text"
      >
        <MoreHorizontal size={20} strokeWidth={2.25} />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+6px)] z-20 bg-surface border border-border rounded-2xl shadow-float py-1.5 min-w-48 overflow-hidden animate-pop-in"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => handleSelect(onAddBooks)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-body-md font-body font-semibold text-left text-primary-text hover:bg-surface-2 transition-colors"
          >
            <BookPlus size={16} className="text-primary-text shrink-0" />
            Agregar libros
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => handleSelect(onEditName)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-body-md font-body text-left text-text hover:bg-surface-2 transition-colors"
          >
            <Pencil size={16} className="text-text-secondary shrink-0" />
            Editar nombre
          </button>

          {canPickRandom && (
            <button
              type="button"
              role="menuitem"
              onClick={() => handleSelect(onPickRandom)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-body-md font-body text-left text-text hover:bg-surface-2 transition-colors"
            >
              <Shuffle size={16} className="text-text-secondary shrink-0" />
              Elegir uno al azar
            </button>
          )}

          {canReorder && (
            <button
              type="button"
              role="menuitem"
              onClick={() => handleSelect(onToggleReorder)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-body-md font-body text-left text-text hover:bg-surface-2 transition-colors"
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
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-body-md font-body text-left text-text hover:bg-surface-2 transition-colors"
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
