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
function Names({ item }: { item?: ShelfItem }) {
  return (
    <div
      aria-hidden="true"
      onClick={item?.onClick}
      className={`h-[52px] pt-2 min-w-0 ${item?.onClick ? 'cursor-pointer' : ''}`}
    >
      {item && (
        <>
          <p className="font-body font-semibold text-[12.5px] leading-[1.2] text-text line-clamp-2">{item.title}</p>
          {item.subtitle && <p className="font-body text-[11.5px] text-text-secondary mt-0.5 truncate">{item.subtitle}</p>}
        </>
      )}
    </div>
  )
}

/** Repisas (V.3.0.0): portadas paradas sobre un tablón, con título y autor debajo.
 *
 *  Es una sola cuadrícula y cada celda lleva su portada, su pedazo de tablón y sus nombres.
 *  Así se puede arrastrar para ordenar (modo "Libre") con una sola lista de dnd-kit: cada
 *  libro se mueve con sus nombres. La última fila se completa con celdas vacías para que el
 *  tablón llegue de lado a lado.
 *
 *  La portada es el botón (con título y autor como nombre accesible); los nombres de abajo
 *  también abren, pero quedan ocultos para lectores de pantalla para no leerse dos veces. */
export function Shelf({ items, perRow = 3, wrap, className = '' }: ShelfProps) {
  const fillers = (perRow - (items.length % perRow)) % perRow

  return (
    <div
      className={`grid gap-x-3 gap-y-5 px-2.5 ${className}`}
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
            <PlankSegment col={i % perRow} perRow={perRow} />
            <Names item={item} />
          </div>
        )
        return wrap ? <div key={item.key} className="contents">{wrap(item, cell)}</div> : <div key={item.key}>{cell}</div>
      })}
      {Array.from({ length: fillers }, (_, j) => (
        <div key={`vacio-${j}`} className="flex flex-col" aria-hidden="true">
          <div className="flex-1" />
          <PlankSegment col={(items.length + j) % perRow} perRow={perRow} />
          <Names />
        </div>
      ))}
    </div>
  )
}
