import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Search, X } from 'lucide-react'

export interface ScreenHeaderTab<T extends string> {
  value: T
  label: string
  /** Cantidad pequeña junto al nombre ("Libros 482"). Sin número, no se muestra. */
  count?: number
}

export interface ScreenHeaderSearch {
  value: string
  onChange: (value: string) => void
  placeholder: string
  /** Botones dentro de la barra, a la derecha (filtros, ordenar). Ver HeaderBarButton. */
  actions?: ReactNode
}

interface ScreenHeaderProps<T extends string> {
  title: string
  /** Texto bajo el título grande (se va con él al bajar). */
  lead?: ReactNode
  search?: ScreenHeaderSearch
  tabs: ScreenHeaderTab<T>[]
  active: T
  onTabChange: (value: T) => void
  /** Enlace a la derecha de las pestañas ("¿Qué leo ahora?"). */
  tabsEnd?: ReactNode
  /** Nombre del grupo de pestañas para lectores de pantalla. */
  tabsLabel: string
}

/** Encabezado de Estante, Cuaderno y Bitácora (V.3.0.0). Arriba el título grande; debajo, una
 *  parte fija con la barra de búsqueda (si hay) y las pestañas subrayadas. Al bajar, el
 *  título grande se va con la página y la parte fija se queda arriba con el nombre de la
 *  pantalla en pequeño, fondo semitransparente con desenfoque y una sombra. Reemplaza a
 *  SearchHeader + SegmentedTabs y a la flecha de subir.
 *
 *  Para saber si ya está pegada arriba se observa una línea invisible justo antes de la
 *  parte fija: cuando sale por arriba de la pantalla, la parte fija ya está pegada. El
 *  safe-area de arriba (iPhone instalado) solo se suma al quedar fija, para no dejar un hueco
 *  bajo el título cuando está en su lugar. */
export function ScreenHeader<T extends string>({
  title,
  lead,
  search,
  tabs,
  active,
  onTabChange,
  tabsEnd,
  tabsLabel,
}: ScreenHeaderProps<T>) {
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
      <header className="px-1 pt-4 pb-3.5">
        <h1 className="font-title text-[clamp(34px,10.5vw,42px)] leading-none tracking-[-0.01em] text-text whitespace-nowrap">
          {title}
        </h1>
        {lead && <p className="font-body text-[15px] leading-[1.45] text-text-secondary mt-2">{lead}</p>}
      </header>

      <div ref={sentinelRef} aria-hidden="true" className="h-px -mb-px" />

      {/* z-20: los menús que se abren desde la barra (Organizar) quedan sobre las portadas. */}
      <div
        className={`sticky top-0 z-20 -mx-4 px-4 mb-5 flex flex-col gap-3.5 bg-bg/88 backdrop-blur-md border-b ${anim} ${
          isStuck ? 'border-border shadow-[0_10px_18px_-14px_rgba(0,0,0,0.6)]' : 'border-transparent'
        }`}
        style={{ paddingTop: isStuck ? 'calc(10px + env(safe-area-inset-top, 0px))' : '10px' }}
      >
        <p
          aria-hidden="true"
          className={`font-title text-[20px] leading-none px-1 overflow-hidden text-text ${anim} ${
            isStuck ? 'max-h-[30px] opacity-100 mb-0' : 'max-h-0 opacity-0 -mb-3.5'
          }`}
        >
          {title}
        </p>

        {search && <HeaderSearch {...search} />}

        <div role="tablist" aria-label={tabsLabel} className="flex items-end gap-[22px] px-1">
          {tabs.map((t) => {
            const isActive = t.value === active
            return (
              <button
                key={t.value}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onTabChange(t.value)}
                className={`relative pb-2.5 font-body text-[15px] whitespace-nowrap rounded-sm focus-visible:outline-2 focus-visible:outline-primary-text ${
                  isActive ? 'text-text font-bold' : 'text-text-secondary font-semibold'
                }`}
              >
                {t.label}
                {t.count !== undefined && (
                  <small className="ml-1 text-[12px] font-semibold text-text-muted tabular-nums">{t.count}</small>
                )}
                {isActive && (
                  <span aria-hidden="true" className="absolute inset-x-0 -bottom-px h-[3px] rounded-[3px] bg-primary" />
                )}
              </button>
            )
          })}
          {tabsEnd && <div className="ml-auto pb-2.5">{tabsEnd}</div>}
        </div>
      </div>
    </>
  )
}

/** Barra de búsqueda siempre visible, con los botones de filtros y ordenar dentro. Escape o
 *  la equis limpian lo escrito. */
function HeaderSearch({ value, onChange, placeholder, actions }: ScreenHeaderSearch) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="flex items-center gap-1 h-[46px] pl-4 pr-1.5 rounded-full bg-surface border border-border shadow-card focus-within:border-primary-text transition-colors">
      <Search size={18} aria-hidden="true" className="shrink-0 text-text-secondary" />
      <input
        ref={inputRef}
        type="search"
        enterKeyHint="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onChange('')
        }}
        placeholder={placeholder}
        aria-label={placeholder}
        className="flex-1 min-w-0 h-full bg-transparent pl-1.5 font-body text-[15px] text-text placeholder:text-text-muted focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <HeaderBarButton
          label="Borrar búsqueda"
          onClick={() => {
            onChange('')
            inputRef.current?.focus()
          }}
        >
          <X size={18} />
        </HeaderBarButton>
      )}
      {actions}
    </div>
  )
}

interface HeaderBarButtonProps {
  label: string
  onClick: () => void
  children: ReactNode
  /** Punto vino arriba a la derecha (por ejemplo, hay filtros activos). */
  dot?: boolean
}

/** Botón redondo de 36px dentro de la barra de búsqueda. */
export function HeaderBarButton({ label, onClick, children, dot }: HeaderBarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="relative w-9 h-9 shrink-0 rounded-full text-text flex items-center justify-center hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-primary-text"
    >
      {children}
      {dot && (
        <span aria-hidden="true" className="absolute top-1 right-1.5 w-2 h-2 rounded-full bg-primary ring-2 ring-surface" />
      )}
    </button>
  )
}
