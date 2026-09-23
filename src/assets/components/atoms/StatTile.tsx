interface StatTileProps {
  label: string
  value: string
  className?: string
}

/** Dato de Bitácora en el rediseño 2026: el valor arriba y la etiqueta abajo, dentro de un
 *  recuadro suave. Las cifras cortas (números, montos) se muestran grandes en Fraunces; los
 *  valores largos (títulos de libros, autores) bajan a un tamaño de texto para que entren
 *  sin romper la cuadrícula. */
export function StatTile({ label, value, className = '' }: StatTileProps) {
  const isShort = value.length <= 12

  return (
    <div className={`bg-surface-2 border border-border rounded-2xl px-3.5 py-3 flex flex-col justify-between gap-1 ${className}`}>
      <p
        className={
          isShort
            ? 'font-display font-semibold text-[22px] leading-tight text-text tabular-nums'
            : 'font-body font-semibold text-body-md leading-snug text-text line-clamp-3'
        }
      >
        {value}
      </p>
      <p className="text-body-sm text-text-secondary leading-snug">{label}</p>
    </div>
  )
}
