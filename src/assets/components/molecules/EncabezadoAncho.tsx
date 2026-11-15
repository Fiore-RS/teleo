import { useEffect, useRef, useState, type ReactNode } from 'react'
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
  /** Sin pestañas (Buscar) el encabezado es solo el título y la línea de debajo. */
  tabs?: EncabezadoTab<T>[]
  active?: T
  onTabChange?: (tab: T) => void
  tabsLabel?: string
  /** Marca de búsqueda ("Buscando “…” ×"), cuando se buscó desde la tapa del cuaderno. */
  search?: { query: string; onClear: () => void }
  /** Algo más junto a las pestañas (por ejemplo "¿Qué leo ahora?"). */
  extra?: ReactNode
  /** Botones a la derecha (Filtros, orden, Vista, buscador...). */
  actions?: ReactNode
  /** Entra con animación cada vez que se monta (V.4.3.0, solo Buscar). */
  entrada?: boolean
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
  entrada = false,
}: EncabezadoAnchoProps<T>) {
  const query = search?.query.trim() ?? ''

  // Fijo al bajar (V.4.2.0): el encabezado se queda arriba con el fondo de la mesa; al pegarse,
  // el título se achica y la línea de debajo se esconde para ocupar menos.
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [isStuck, setIsStuck] = useState(false)
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => {
      setIsStuck(!entry.isIntersecting && entry.boundingClientRect.top < 0)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  const anim = 'transition-all duration-250 ease-out motion-reduce:transition-none'

  return (
    <>
    <div ref={sentinelRef} aria-hidden="true" className="h-px -mb-px" />
    <header
      className={`encabezado-fijo sticky top-0 z-20 mb-7 border-b ${anim} ${entrada ? 'animate-rise-in' : ''} ${
        isStuck ? 'pt-3.5 pb-3.5 border-border shadow-[0_10px_18px_-14px_rgba(0,0,0,0.5)] backdrop-blur-md' : 'pt-0 pb-0 border-transparent'
      }`}
      data-stuck={isStuck || undefined}
    >
      <h1 className={`font-title leading-none text-text ${anim} ${isStuck ? 'text-[24px]' : 'text-[32px]'}`}>{title}</h1>
      {subtitle && (
        <p
          className={`font-display italic text-[19px] leading-snug text-text-secondary overflow-hidden ${anim} ${
            isStuck ? 'max-h-0 opacity-0 mt-0' : 'max-h-12 opacity-100 mt-2'
          }`}
        >
          {subtitle}
        </p>
      )}

      {(tabs || search || extra || actions) && (
      <div className={`${isStuck ? 'mt-3' : subtitle ? 'mt-5' : 'mt-6'} flex items-center justify-between gap-4 flex-wrap ${anim}`}>
        <div className="flex items-center gap-3 flex-wrap">
          {tabs && (
          <div role="tablist" aria-label={tabsLabel} className="flex gap-1">
            {tabs.map(({ value, label, count }) => {
              const isActive = value === active
              return (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => onTabChange?.(value)}
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
          )}

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
      )}
    </header>
    </>
  )
}

/** Botón con borde y nombre de las acciones del encabezado ancho (Filtros, Vista...). */
export const encabezadoBoton =
  'relative h-10 px-3.5 inline-flex items-center gap-2 rounded-button border border-border bg-surface text-text font-body font-semibold text-body-md hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-primary-text'
