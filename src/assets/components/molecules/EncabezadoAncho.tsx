import type { ReactNode } from 'react'
import { X } from 'lucide-react'

export interface EncabezadoTab<T extends string> {
  value: T
  label: string
  /** undefined mientras carga. */
  count?: number
}

interface EncabezadoAnchoProps<T extends string> {
  title: string
  /** Línea en cursiva debajo del título (como el saludo de La mesa). Opcional. */
  subtitle?: string
  tabs: EncabezadoTab<T>[]
  active: T
  onTabChange: (tab: T) => void
  tabsLabel: string
  /** Marca de búsqueda ("Buscando “…” ×"), cuando se buscó desde la tapa del cuaderno. */
  search?: { query: string; onClear: () => void }
  /** Algo más junto a las pestañas (por ejemplo "¿Qué leo ahora?"). */
  extra?: ReactNode
  /** Botones a la derecha (Filtros, orden, Vista, buscador...). */
  actions?: ReactNode
}

/** Encabezado de las pantallas con pestañas en tableta y computadora (V.4.2.0; nació en el
 *  Estante en la V.4.1.0): el título de La mesa (Young Serif 32px) con su línea en cursiva
 *  opcional, y debajo las pestañas con su número a la izquierda y los botones a la derecha.
 *  En el celular cada pantalla sigue con el encabezado fijo de siempre (ScreenHeader). */
export function EncabezadoAncho<T extends string>({
  title,
  subtitle,
  tabs,
  active,
  onTabChange,
  tabsLabel,
  search,
  extra,
  actions,
}: EncabezadoAnchoProps<T>) {
  const query = search?.query.trim() ?? ''

  return (
    <header className="mb-7">
      <h1 className="font-title text-[32px] leading-none text-text">{title}</h1>
      {subtitle && <p className="mt-2 font-display italic text-[19px] leading-snug text-text-secondary">{subtitle}</p>}

      <div className={`${subtitle ? 'mt-5' : 'mt-6'} flex items-center justify-between gap-4 flex-wrap`}>
        <div className="flex items-center gap-3 flex-wrap">
          <div role="tablist" aria-label={tabsLabel} className="flex gap-1">
            {tabs.map(({ value, label, count }) => {
              const isActive = value === active
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

          {search && query && (
            <span className="inline-flex items-center gap-1.5 h-[34px] pl-3 pr-1.5 rounded-button bg-primary-soft text-primary-text font-body font-bold text-body-sm">
              Buscando “{query}”
              <button
                type="button"
                onClick={search.onClear}
                aria-label="Quitar búsqueda"
                className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-surface/60 focus-visible:outline-2 focus-visible:outline-primary-text"
              >
                <X size={14} />
              </button>
            </span>
          )}

          {extra}
        </div>

        {actions && <div className="flex items-center gap-2.5 flex-wrap">{actions}</div>}
      </div>
    </header>
  )
}

/** Botón con borde y nombre de las acciones del encabezado ancho (Filtros, Vista...). */
export const encabezadoBoton =
  'relative h-10 px-3.5 inline-flex items-center gap-2 rounded-button border border-border bg-surface text-text font-body font-semibold text-body-md hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-primary-text'
