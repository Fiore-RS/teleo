import { useEffect, useRef, useState } from 'react'
import { ArrowUpDown, Check, type LucideIcon } from 'lucide-react'

export interface SortMenuOption<T extends string> {
  key: T
  label: string
  icon: LucideIcon
}

interface SortMenuProps<T extends string> {
  options: SortMenuOption<T>[]
  activeKey: T
  onSelect: (key: T) => void
  className?: string
}

/** Botón "Organizar" que despliega un menú de modos de orden — mismo patrón que
 *  `StatusMenu`/`PriorityListMenu` (botón + panel absoluto que se cierra al tocar afuera).
 *  Reemplaza el toggle simple de arrastrar que tenían Estante y (nuevo) Cuaderno, dando
 *  variedad para organizar por título, autor, fecha agregado o el modo libre de siempre. */
export function SortMenu<T extends string>({ options, activeKey, onSelect, className = '' }: SortMenuProps<T>) {
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

  function handleSelect(key: T) {
    setIsOpen(false)
    onSelect(key)
  }

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        aria-label="Organizar"
        className="w-full inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-3 text-body-sm font-body text-surface"
        style={{ backgroundColor: 'var(--color-state-pending)' }}
      >
        <ArrowUpDown size={15} />
        Organizar
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+6px)] z-20 bg-surface border border-border rounded-xl shadow-lg py-1.5 min-w-52 overflow-hidden"
        >
          {options.map((opt) => {
            const isActive = opt.key === activeKey
            const Icon = opt.icon
            return (
              <button
                key={opt.key}
                type="button"
                role="menuitem"
                onClick={() => handleSelect(opt.key)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-body-md font-body text-left transition-colors ${
                  isActive ? 'bg-bg' : 'hover:bg-bg'
                }`}
              >
                <Icon size={16} className="text-text-secondary shrink-0" />
                <span className="flex-1 text-text truncate">{opt.label}</span>
                {isActive && <Check size={14} className="text-accent-wishlist shrink-0" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
