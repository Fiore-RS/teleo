import { ChevronDown, Check } from 'lucide-react'
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'

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

/** Alto máximo del menú (igual que el antiguo max-h-64) y separación con el botón. */
const MENU_MAX_HEIGHT = 256
const MENU_GAP = 6
/** Margen mínimo con los bordes de la pantalla. */
const VIEWPORT_MARGIN = 12

/** El menú se dibuja en un portal con posición fija (V.2.2.1): dentro de una hoja quedaba
 *  recortado por la zona que se desplaza y por los botones fijos del pie. Si abajo no cabe,
 *  se abre hacia arriba, y sigue al botón si la hoja se desplaza. */
export function Select({ options, value, onChange, className = '', disabled, placeholder, bare = false }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [menuStyle, setMenuStyle] = useState<CSSProperties | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const close = useCallback(() => {
    setIsOpen(false)
    setMenuStyle(null)
  }, [])

  const updatePosition = useCallback(() => {
    const button = buttonRef.current
    if (!button) return
    const rect = button.getBoundingClientRect()
    const viewportH = window.innerHeight
    const viewportW = window.innerWidth
    const menuH = Math.min(menuRef.current?.scrollHeight ?? MENU_MAX_HEIGHT, MENU_MAX_HEIGHT)
    const spaceBelow = viewportH - rect.bottom - MENU_GAP - VIEWPORT_MARGIN
    const spaceAbove = rect.top - MENU_GAP - VIEWPORT_MARGIN
    const openUp = spaceBelow < menuH && spaceAbove > spaceBelow
    const maxHeight = Math.max(120, Math.min(MENU_MAX_HEIGHT, openUp ? spaceAbove : spaceBelow))

    const style: CSSProperties = { position: 'fixed', maxHeight }
    if (openUp) style.bottom = viewportH - rect.top + MENU_GAP
    else style.top = rect.bottom + MENU_GAP
    if (bare) {
      style.right = Math.max(VIEWPORT_MARGIN, viewportW - rect.right)
      style.maxWidth = viewportW - VIEWPORT_MARGIN * 2
    } else {
      style.left = rect.left
      style.width = rect.width
    }
    setMenuStyle(style)
  }, [bare])

  useLayoutEffect(() => {
    if (!isOpen) return
    updatePosition()
    // Si la hoja se desplaza o cambia el tamaño de la pantalla, el menú sigue al botón.
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [isOpen, updatePosition])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node
      if (containerRef.current?.contains(target) || menuRef.current?.contains(target)) return
      close()
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKey)
    }
  }, [close])

  const selected = options.find((opt) => opt.value === value)

  function handleSelect(optValue: string) {
    onChange?.({ target: { value: optValue } })
    close()
  }

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => (isOpen ? close() : setIsOpen(true))}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
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

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            // Por encima de las hojas (z-50). Invisible hasta conocer su posición, para que no
            // aparezca un instante en la esquina.
            style={menuStyle ?? { position: 'fixed', visibility: 'hidden' }}
            className={`z-70 bg-surface border border-border rounded-2xl shadow-float py-1.5 overflow-y-auto ${
              bare ? 'min-w-48 animate-pop-in' : ''
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
          </div>,
          document.body,
        )}
    </div>
  )
}
