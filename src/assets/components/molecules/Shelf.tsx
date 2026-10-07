import type { ReactNode } from 'react'

export interface ShelfItem {
  key: string
  /** Portada (o pila de portadas) que va parada sobre la repisa. */
  cover: ReactNode
  title: string
  subtitle?: string
  onClick?: () => void
}

interface ShelfProps {
  items: ShelfItem[]
  /** Cuántos van en cada repisa. Por defecto tres. */
  perRow?: number
  className?: string
}

/** Tablón de madera bajo cada fila de portadas, en los colores del tema. */
export function ShelfPlank({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`h-3 -mx-0.5 rounded border border-border shadow-[0_8px_12px_-8px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)] ${className}`}
      style={{
        background:
          'linear-gradient(180deg, var(--color-surface-2), color-mix(in srgb, var(--color-surface-2) 80%, #000))',
      }}
    />
  )
}

function rowsOf<T>(arr: T[], n: number) {
  const rows: T[][] = []
  for (let i = 0; i < arr.length; i += n) rows.push(arr.slice(i, i + n))
  return rows
}

/** Repisas (V.3.0.0): filas de portadas paradas sobre un tablón, con título y autor debajo.
 *  La portada es el botón (con el título como nombre accesible); los nombres de abajo también
 *  abren, pero quedan ocultos para lectores de pantalla para no leerse dos veces. */
export function Shelf({ items, perRow = 3, className = '' }: ShelfProps) {
  const cols = { gridTemplateColumns: `repeat(${perRow}, minmax(0, 1fr))` }

  return (
    <div className={`flex flex-col gap-5 ${className}`}>
      {rowsOf(items, perRow).map((row) => (
        <div key={row.map((i) => i.key).join('|')}>
          <div className="grid gap-3 px-2.5 items-end" style={cols}>
            {row.map((item) =>
              item.onClick ? (
                <button
                  key={item.key}
                  type="button"
                  onClick={item.onClick}
                  aria-label={item.subtitle ? `${item.title}, ${item.subtitle}` : item.title}
                  className="block w-full text-left rounded-[9px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-text"
                >
                  {item.cover}
                </button>
              ) : (
                <div key={item.key}>{item.cover}</div>
              )
            )}
          </div>
          <ShelfPlank />
          <div className="grid gap-3 px-2.5 pt-2" style={cols} aria-hidden="true">
            {row.map((item) => (
              <div key={item.key} onClick={item.onClick} className={`min-w-0 ${item.onClick ? 'cursor-pointer' : ''}`}>
                <p className="font-body font-semibold text-[12.5px] leading-[1.2] text-text line-clamp-2">{item.title}</p>
                {item.subtitle && (
                  <p className="font-body text-[11.5px] text-text-secondary mt-0.5 truncate">{item.subtitle}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
