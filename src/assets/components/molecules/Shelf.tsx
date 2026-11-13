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
  /** Librero de pared (V.4.1.0, tableta y computadora): las repisas van dentro de un mueble
   *  de madera del color de repisa del tema, con el fondo oscuro y los nombres en letra clara.
   *  Solo aplica con tablón. */
  librero?: boolean
  className?: string
}

/** Espacio entre columnas y aire a los lados de la repisa, en px. El tablón de cada celda se
 *  estira con estos valores para verse como uno solo. */
const SPACING = {
  normal: { gap: 12, pad: 10 },
  librero: { gap: 20, pad: 20 },
}

// V.3.6.0: el tablón usa el color de repisa de cada tema (--color-shelf); antes era el
// surface-2 y casi no se notaba contra el fondo, ni en claro ni en oscuro.
const plankBackground: CSSProperties = {
  background: 'linear-gradient(180deg, var(--color-shelf), color-mix(in srgb, var(--color-shelf) 78%, #000))',
  borderColor: 'color-mix(in srgb, var(--color-shelf) 70%, #000)',
}

/** Tablón de madera bajo una fila de portadas, en el color de repisa del tema. */
export function ShelfPlank({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`h-3 -mx-0.5 rounded border border-border shadow-[0_8px_12px_-8px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.18)] ${className}`}
      style={plankBackground}
    />
  )
}

/** Pedazo del tablón bajo una sola celda. Se estira hasta la mitad del espacio entre
 *  columnas (gap-3 = 12px) y, en los extremos, hasta el borde de la repisa (px-2.5 + 2px),
 *  así los pedazos de una fila se ven como un solo tablón. */
function PlankSegment({ col, perRow, gap, pad }: { col: number; perRow: number; gap: number; pad: number }) {
  const first = col === 0
  const last = col === perRow - 1
  return (
    <div
      aria-hidden="true"
      className={`h-3 shrink-0 border-y border-border shadow-[0_8px_12px_-8px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.18)] ${
        first ? 'border-l rounded-l' : ''
      } ${last ? 'border-r rounded-r' : ''}`}
      style={{ ...plankBackground, marginLeft: first ? -(pad + 2) : -gap / 2, marginRight: last ? -(pad + 2) : -gap / 2 }}
    />
  )
}

/** Título y autor bajo el tablón. Alto fijo para que todos los tablones de una fila queden
 *  a la misma altura aunque un título ocupe una línea y otro dos. */
function Names({ item, compact, onWood = false }: { item?: ShelfItem; compact: boolean; onWood?: boolean }) {
  return (
    <div
      aria-hidden="true"
      onClick={item?.onClick}
      className={`${compact ? 'h-[40px]' : 'h-[52px]'} pt-2 min-w-0 ${item?.onClick ? 'cursor-pointer' : ''}`}
    >
      {item && (
        <>
          {/* Con 4 columnas no cabe mucho: el título va en un solo renglón. */}
          <p className={`font-body font-semibold leading-[1.2] ${onWood ? 'text-[#FBF3EA]' : 'text-text'} ${compact ? 'text-[11.5px] truncate' : 'text-[12.5px] line-clamp-2'}`}>
            {item.title}
          </p>
          {item.subtitle && (
            <p className={`font-body mt-0.5 truncate ${onWood ? 'text-[#FBF3EA]/70' : 'text-text-secondary'} ${compact ? 'text-[10.5px]' : 'text-[11.5px]'}`}>{item.subtitle}</p>
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
export function Shelf({ items, perRow = 3, showNames = true, planks = true, wrap, librero = false, className = '' }: ShelfProps) {
  const inLibrero = librero && planks
  const { gap, pad } = inLibrero ? SPACING.librero : SPACING.normal
  // Las celdas vacías solo hacen falta para que el tablón llegue de lado a lado.
  const fillers = planks ? (perRow - (items.length % perRow)) % perRow : 0
  // En el librero las celdas son anchas: el título puede ocupar dos renglones.
  const compact = perRow >= 4 && !inLibrero
  const rowGap = inLibrero ? 'gap-y-7' : planks ? 'gap-y-5' : 'gap-y-3'

  const grid = (
    <div
      className={`grid ${rowGap} ${inLibrero ? 'pt-7 pb-4' : ''} ${className}`}
      style={{
        gridTemplateColumns: `repeat(${perRow}, minmax(0, 1fr))`,
        columnGap: gap,
        paddingInline: planks ? pad : undefined,
      }}
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
                  className="block w-full text-left rounded-[10px] transition-transform duration-200 hover:-translate-y-1 motion-reduce:transition-none motion-reduce:hover:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-text"
                >
                  {item.cover}
                </button>
              ) : (
                item.cover
              )}
            </div>
            {planks && <PlankSegment col={i % perRow} perRow={perRow} gap={gap} pad={pad} />}
            {showNames && <Names item={item} compact={compact} onWood={inLibrero} />}
          </div>
        )
        return wrap ? <div key={item.key} className="contents">{wrap(item, cell)}</div> : <div key={item.key}>{cell}</div>
      })}
      {Array.from({ length: fillers }, (_, j) => (
        <div key={`vacio-${j}`} className="flex flex-col" aria-hidden="true">
          <div className="flex-1" />
          <PlankSegment col={(items.length + j) % perRow} perRow={perRow} gap={gap} pad={pad} />
          {showNames && <Names compact={compact} onWood={inLibrero} />}
        </div>
      ))}
    </div>
  )

  if (!inLibrero) return grid

  // El mueble: marco del color de repisa del tema y, adentro, el fondo oscuro con sombra
  // arriba y a los lados, como un librero de pared.
  return (
    <div
      className="rounded-[10px] p-3.5 pb-6"
      style={{
        background: 'linear-gradient(180deg, color-mix(in srgb, var(--color-shelf) 82%, #000), color-mix(in srgb, var(--color-shelf) 70%, #000))',
        boxShadow: '0 30px 50px -26px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.15)',
      }}
    >
      <div
        className="rounded-[4px]"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--color-shelf) 45%, #000)',
          backgroundImage: 'linear-gradient(90deg, rgba(0,0,0,0.18), transparent 40px, transparent calc(100% - 40px), rgba(0,0,0,0.18))',
          boxShadow: 'inset 0 10px 18px -8px rgba(0,0,0,0.55)',
        }}
      >
        {grid}
      </div>
    </div>
  )
}
