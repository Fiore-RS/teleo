import type { ReactNode } from 'react'
import { LayoutGrid, SlidersHorizontal, X } from 'lucide-react'

type EstanteTab = 'libros' | 'sagas'

interface EstanteEncabezadoProps {
  tab: EstanteTab
  onTabChange: (tab: EstanteTab) => void
  /** Cuántos se ven con los filtros puestos (undefined mientras carga). */
  bookCount?: number
  sagaCount?: number
  subtitle: string
  /** Lo que se está buscando desde la tapa del cuaderno, si hay algo. */
  search: string
  onClearSearch: () => void
  hasFilters: boolean
  onFilters: () => void
  onView: () => void
  /** Menú de orden (SortMenu con la variante 'button'). */
  sortMenu: ReactNode
  /** "¿Qué leo ahora?" (solo en Libros). */
  onRandomPick?: () => void
}

/** Encabezado del Estante en tableta y computadora (V.4.1.0): "Estante" grande con una línea
 *  en cursiva debajo; las pestañas Libros y Sagas; y los botones con su nombre (Filtros, el
 *  orden elegido y Vista). Sin buscador: se busca desde la tapa del cuaderno, y aquí solo
 *  queda la marca de lo que se está buscando, para borrarla. En el celular sigue el
 *  encabezado fijo de siempre (ScreenHeader). */
export function EstanteEncabezado({
  tab,
  onTabChange,
  bookCount,
  sagaCount,
  subtitle,
  search,
  onClearSearch,
  hasFilters,
  onFilters,
  onView,
  sortMenu,
  onRandomPick,
}: EstanteEncabezadoProps) {
  const tabs: { value: EstanteTab; label: string; count?: number }[] = [
    { value: 'libros', label: 'Libros', count: bookCount },
    { value: 'sagas', label: 'Sagas', count: sagaCount },
  ]
  const query = search.trim()

  return (
    <header className="mb-7">
      <h1 className="font-title text-[32px] leading-none text-text">Estante</h1>
      <p className="mt-2 font-display italic text-[19px] leading-snug text-text-secondary">{subtitle}</p>

      <div className="mt-5 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <div role="tablist" aria-label="Libros o sagas" className="flex gap-1">
            {tabs.map(({ value, label, count }) => {
              const isActive = value === tab
              return (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => onTabChange(value)}
                  className={`h-[38px] px-4 inline-flex items-center gap-2 rounded-button font-body font-semibold text-body-md transition-colors motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-text ${
                    isActive ? 'bg-primary text-primary-ink' : 'text-text-secondary hover:bg-border hover:text-text'
                  }`}
                >
                  {label}
                  {count !== undefined && (
                    <span className={`text-[13px] font-bold tabular-nums ${isActive ? 'text-primary-ink/80' : 'text-text-muted'}`}>{count}</span>
                  )}
                </button>
              )
            })}
          </div>

          {query && (
            <span className="inline-flex items-center gap-1.5 h-[34px] pl-3 pr-1.5 rounded-button bg-primary-soft text-primary-text font-body font-bold text-body-sm">
              Buscando “{query}”
              <button
                type="button"
                onClick={onClearSearch}
                aria-label="Quitar búsqueda"
                className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-surface/60 focus-visible:outline-2 focus-visible:outline-primary-text"
              >
                <X size={14} />
              </button>
            </span>
          )}

          {onRandomPick && (
            <button
              type="button"
              onClick={onRandomPick}
              className="font-body text-body-sm font-bold text-primary-text hover:underline underline-offset-4 rounded-chip focus-visible:outline-2 focus-visible:outline-primary-text"
            >
              ¿Qué leo ahora?
            </button>
          )}
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={onFilters}
            className="relative h-10 px-3.5 inline-flex items-center gap-2 rounded-button border border-border bg-surface text-text font-body font-semibold text-body-md hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-primary-text"
          >
            <SlidersHorizontal size={17} aria-hidden="true" />
            Filtros
            {hasFilters && (
              <span aria-label="(con filtros puestos)" className="w-2 h-2 rounded-full bg-primary" />
            )}
          </button>
          {sortMenu}
          <button
            type="button"
            onClick={onView}
            className="h-10 px-3.5 inline-flex items-center gap-2 rounded-button border border-border bg-surface text-text font-body font-semibold text-body-md hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-primary-text"
          >
            <LayoutGrid size={17} aria-hidden="true" />
            Vista
          </button>
        </div>
      </div>
    </header>
  )
}
