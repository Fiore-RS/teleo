import { useEffect, useRef, type ReactNode } from 'react'
import { SearchBar } from './SearchBar'

interface SearchHeaderProps {
  /** Contenido normal del encabezado (título, conteo y botones de acción). */
  children: ReactNode
  isSearching: boolean
  onCancel: () => void
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

/** Encabezado de pantalla que se transforma en barra de búsqueda. Rediseño 2026: la búsqueda
 *  ya no ocupa una fila fija; se abre con el botón de lupa y reemplaza al encabezado con una
 *  transición suave (se desvanece y se desliza). "Cancelar" o Escape limpian la búsqueda y
 *  devuelven el encabezado. Las dos capas viven en la misma celda de un grid para que el
 *  alto del encabezado no salte al cambiar. */
export function SearchHeader({
  children,
  isSearching,
  onCancel,
  value,
  onChange,
  placeholder,
}: SearchHeaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isSearching) return
    // Se espera a que empiece la transición para que el foco no haga saltar el scroll.
    const t = setTimeout(() => inputRef.current?.focus(), 120)
    return () => clearTimeout(t)
  }, [isSearching])

  const layer = 'col-start-1 row-start-1 transition-all duration-300 ease-out motion-reduce:transition-none'

  return (
    // relative + z-20: el encabezado queda por encima del contenido de la página, así los menús
    // que se abren desde sus botones (Organizar) no quedan tapados por las portadas de abajo.
    <header className="relative z-20 grid px-1 pt-4 pb-5">
      <div
        inert={isSearching}
        className={`${layer} flex items-end justify-between gap-3 ${
          isSearching ? 'opacity-0 -translate-y-2 pointer-events-none' : 'opacity-100 translate-y-0'
        }`}
      >
        {children}
      </div>

      <div
        inert={!isSearching}
        className={`${layer} self-end flex items-center gap-3 ${
          isSearching ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
        }`}
      >
        <SearchBar
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') onCancel()
          }}
          placeholder={placeholder}
          className="flex-1 min-w-0"
        />
        <button
          type="button"
          onClick={onCancel}
          className="shrink-0 font-body font-bold text-body-md text-primary-text px-1 py-2 rounded-lg focus-visible:outline-2 focus-visible:outline-primary-text"
        >
          Cancelar
        </button>
      </div>
    </header>
  )
}
