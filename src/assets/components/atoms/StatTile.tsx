/** Fondo y color de la cifra. 'neutral' es el recuadro crema de siempre. */
export type StatTileTone = 'neutral' | 'orange' | 'pink' | 'magenta'

const toneStyles: Record<StatTileTone, { box: string; value: string }> = {
  neutral: { box: 'bg-surface-2', value: 'text-text' },
  orange: { box: 'bg-orange-soft', value: 'text-orange-text' },
  pink: { box: 'bg-pink-soft', value: 'text-pink-text' },
  magenta: { box: 'bg-magenta-soft', value: 'text-magenta-text' },
}

interface StatTileProps {
  label: string
  value: string
  className?: string
  tone?: StatTileTone
  /** Fuerza el tamaño de texto aunque el valor sea corto. Para grupos de montos (Compras),
   *  donde el tamaño no puede depender de cuántos dígitos tenga cada cifra: si no, un monto
   *  corto sale grande y uno largo sale chico, y los recuadros no se ven parejos. */
  compact?: boolean
}

/** Dato de Bitácora en el rediseño 2026: el valor arriba y la etiqueta abajo, dentro de un
 *  recuadro suave. Las cifras cortas (números, montos) se muestran grandes en Fraunces; los
 *  valores largos (títulos de libros, autores) bajan a un tamaño de texto para que entren
 *  sin romper la cuadrícula. */
export function StatTile({ label, value, className = '', tone = 'neutral', compact = false }: StatTileProps) {
  const isShort = !compact && value.length <= 12
  const style = toneStyles[tone]

  return (
    <div className={`${style.box} border border-border rounded-2xl px-3.5 py-3 flex flex-col justify-between gap-1 ${className}`}>
      <p
        className={
          isShort
            ? `font-display font-semibold text-[22px] leading-tight tabular-nums ${style.value}`
            : `font-body font-semibold text-body-md leading-snug line-clamp-3 ${style.value}`
        }
      >
        {value}
      </p>
      <p className="text-body-sm text-text-secondary leading-snug">{label}</p>
    </div>
  )
}
