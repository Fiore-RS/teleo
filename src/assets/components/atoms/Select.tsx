import { ChevronDown, Check } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface SelectProps {
  options: { value: string; label: string }[]
  value?: string
  onChange?: (e: { target: { value: string } }) => void
  className?: string
  disabled?: boolean
  placeholder?: string
  /** Sin caja, alineado a la derecha y con el menú del ancho de sus opciones: para filas
   *  compactas de formulario (nombre a la izquierda, valor a la derecha). */
  bare?: boolean
}

export function Select({ options, value, onChange, className = '', disabled, placeholder, bare = false }: SelectProps) {
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

  const selected = options.find((opt) => opt.value === value)

  function handleSelect(optValue: string) {
    onChange?.({ target: { value: optValue } })
    setIsOpen(false)
  }

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((o) => !o)}
        className={`w-full flex items-center gap-2 text-body-lg font-body text-text transition-colors ${
          bare
            ? 'justify-end text-right'
            : `justify-between text-left bg-surface-2 border rounded-2xl py-3 pl-4 pr-4 ${isOpen ? 'border-primary-text' : 'border-border'}`
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      >
        <span className={`truncate ${!selected ? 'text-text-secondary' : ''}`}>
          {selected ? selected.label : placeholder ?? 'Selecciona'}
        </span>
        <ChevronDown
          size={18}
          className={`shrink-0 transition-transform duration-200 ${bare ? 'text-primary-text' : 'text-text-secondary'} ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          className={`absolute top-[calc(100%+6px)] z-20 bg-surface border border-border rounded-2xl shadow-float py-1.5 max-h-64 overflow-y-auto ${
            bare ? 'right-0 min-w-48 animate-pop-in' : 'left-0 right-0'
          }`}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(opt.value)}
                className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 text-body-lg font-body text-left transition-colors ${
                  isSelected ? 'text-primary-text bg-bg' : 'text-text hover:bg-bg'
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && <Check size={16} className="shrink-0" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}