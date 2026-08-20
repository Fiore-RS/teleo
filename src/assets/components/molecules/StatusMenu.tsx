import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { statusColorVar, statusLabel, type ReadingStatus } from '../../../lib/status'

const ALL_STATUSES: ReadingStatus[] = ['pendiente', 'leyendo', 'terminado', 'abandonado', 'deseado']

interface StatusMenuProps {
  status: ReadingStatus
  onChange: (status: ReadingStatus) => void
  className?: string
}

/** Insignia de estado clickeable (como en Goodreads): al tocarla se abre un menú en cascada
 *  para cambiar el estado de lectura del libro directamente, sin tener que entrar a "Editar
 *  Libro". Se ve igual que el `Badge` normal, pero es un botón con un menú desplegable. */
export function StatusMenu({ status, onChange, className = '' }: StatusMenuProps) {
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

  function handleSelect(newStatus: ReadingStatus) {
    setIsOpen(false)
    if (newStatus !== status) onChange(newStatus)
  }

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        aria-label="Cambiar estado de lectura"
        className="inline-flex items-center gap-1.5 pl-4 pr-4 py-1.5 rounded-full text-body-sm font-body transition-opacity active:opacity-80"
        style={{ backgroundColor: statusColorVar[status], color: 'var(--color-surface)' }}
      >
        {statusLabel[status]}
        <ChevronDown size={15} className={`shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          role="listbox"
          className="absolute right-0 top-[calc(100%+6px)] z-20 bg-surface border border-border rounded-xl shadow-lg py-1.5 min-w-40 overflow-hidden"
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
                  isSelected ? 'bg-bg' : 'hover:bg-bg'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: statusColorVar[s] }} />
                <span className="flex-1 text-text truncate">{statusLabel[s]}</span>
                {isSelected && <Check size={14} className="text-accent-wishlist shrink-0" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
