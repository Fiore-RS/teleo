import type { CSSProperties, ReactNode } from 'react'

export interface ShelfItem {
  key: string
  /** Portada (o pila de portadas) que va parada sobre la repisa. No debe ser un botón: la
   *  repisa ya la envuelve en uno. */
  cover: ReactNode
  title: string
  subtitle?: string
  onClick?: () => void
}

interface ShelfProps {
  items: ShelfItem[]
  /** Cuántos van en cada repisa. Por defecto tres. */
  perRow?: number
  /** Título y autor debajo de cada portada. Sin ellos se ven solo las portadas. */
  showNames?: boolean
  /** Tablón bajo cada fila. Sin él queda una cuadrícula simple (la de antes de la 3.0.0). */
  planks?: boolean
  /** Envoltorio de cada libro, por ejemplo para arrastrarlo (SortableItem). Debe dejar que
   *  el contenido ocupe todo el alto de la celda. */
  wrap?: (item: ShelfItem, cell: ReactNode) => ReactNode
  className?: string
}

const plankBackground: CSSProperties = {
  background: 'linear-gradient(180deg, var(--color-surface-2), color-mix(in srgb, var(--color-surface-2) 80%, #000))',
}

/** Tablón de madera bajo una fila de portadas, en los colores del tema. */
export function ShelfPlank({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`h-3 -mx-0.5 rounded border border-border shadow-[0_8px_12px_-8px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)] ${className}`}
      style={plankBackground}
    />
  )
}

/** Pedazo del tablón bajo una sola celda. Se estira hasta la mitad del espacio entre
 *  columnas (gap-3 = 12px) y, en los extremos, hasta el borde de la repisa (px-2.5 + 2px),
 *  así los pedazos de una fila se ven como un solo tablón. */
function PlankSegment({ col, perRow }: { col: number; perRow: number }) {
  const first = col === 0
  const last = col === perRow - 1
  return (
    <div
      aria-hidden="true"
      className={`h-3 shrink-0 border-y border-border shadow-[0_8px_12px_-8px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)] ${
        first ? 'border-l rounded-l' : ''
      } ${last ? 'border-r rounded-r' : ''}`}
      style={{ ...plankBackground, marginLeft: first ? -12 : -6, marginRight: last ? -12 : -6 }}
    />
  )
}

/** Título y autor bajo el tablón. Alto fijo para que todos los tablones de una fila queden
 *  a la misma altura aunque un título ocupe una línea y otro dos. */
function Names({ item, compact }: { item?: ShelfItem; compact: boolean }) {
  return (
    <div
      aria-hidden="true"
      onClick={item?.onClick}
      className={`${compact ? 'h-[40px]' : 'h-[52px]'} pt-2 min-w-0 ${item?.onClick ? 'cursor-pointer' : ''}`}
    >
      {item && (
        <>
          {/* Con 4 columnas no cabe mucho: el título va en un solo renglón. */}
          <p className={`font-body font-semibold leading-[1.2] text-text ${compact ? 'text-[11.5px] truncate' : 'text-[12.5px] line-clamp-2'}`}>
            {item.title}
          </p>
          {item.subtitle && (
            <p className={`font-body text-text-secondary mt-0.5 truncate ${compact ? 'text-[10.5px]' : 'text-[11.5px]'}`}>{item.subtitle}</p>
          )}
        </>
      )}
    </div>
  )
}

/** Repisas (V.3.0.0): portadas paradas sobre un tablón, con título y autor debajo. Cada
 *  cuenta elige la vista (ver lib/shelfView): 3 o 4 por fila, con o sin nombres, con o sin
 *  tablón.
 *
 *  Es una sola cuadrícula y cada celda lleva su portada, su pedazo de tablón y sus nombres.
 *  Así se puede arrastrar para ordenar (modo "Libre") con una sola lista de dnd-kit: cada
 *  libro se mueve con sus nombres. La última fila se completa con celdas vacías para que el
 *  tablón llegue de lado a lado.
 *
 *  La portada es el botón (con título y autor como nombre accesible); los nombres de abajo
 *  también abren, pero quedan ocultos para lectores de pantalla para no leerse dos veces. */
export function Shelf({ items, perRow = 3, showNames = true, planks = true, wrap, className = '' }: ShelfProps) {
  // Las celdas vacías solo hacen falta para que el tablón llegue de lado a lado.
  const fillers = planks ? (perRow - (items.length % perRow)) % perRow : 0
  const compact = perRow >= 4
  const rowGap = planks ? 'gap-y-5' : 'gap-y-3'

  return (
    <div
      className={`grid gap-x-3 ${rowGap} ${planks ? 'px-2.5' : ''} ${className}`}
      style={{ gridTemplateColumns: `repeat(${perRow}, minmax(0, 1fr))` }}
    >
      {items.map((item, i) => {
        const cell = (
          <div className="h-full flex flex-col">
            <div className="flex-1 flex flex-col justify-end">
              {item.onClick ? (
                <button
                  type="button"
                  onClick={item.onClick}
                  aria-label={item.subtitle ? `${item.title}, ${item.subtitle}` : item.title}
                  className="block w-full text-left rounded-[10px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-text"
                >
                  {item.cover}
                </button>
              ) : (
                item.cover
              )}
            </div>
            {planks && <PlankSegment col={i % perRow} perRow={perRow} />}
            {showNames && <Names item={item} compact={compact} />}
          </div>
        )
        return wrap ? <div key={item.key} className="contents">{wrap(item, cell)}</div> : <div key={item.key}>{cell}</div>
      })}
      {Array.from({ length: fillers }, (_, j) => (
        <div key={`vacio-${j}`} className="flex flex-col" aria-hidden="true">
          <div className="flex-1" />
          <PlankSegment col={(items.length + j) % perRow} perRow={perRow} />
          {showNames && <Names compact={compact} />}
        </div>
      ))}
    </div>
  )
}
