interface BarChartProps {
  data: { label: string; value: number }[]
  color?: string
  /** Barra a destacar (por ejemplo, el mes actual) y su color. */
  highlightIndex?: number
  highlightColor?: string
  height?: number // alto de la zona de barras en rem
  className?: string
}

/** Barras simples dibujadas a mano (sin librería de gráficas), mismo lenguaje visual que
 *  ProgressBar: track suave, relleno con el degradado de marca. Usado para el recap
 *  mensual/anual de Bitácora. */
export function BarChart({ data, color, highlightIndex, highlightColor, height = 6, className = '' }: BarChartProps) {
  // Sin color explícito, las barras usan el degradado de marca (vino → rosa), como ProgressBar.
  const fill = color ?? 'linear-gradient(180deg, var(--color-rose), var(--color-primary))'
  const max = Math.max(1, ...data.map((d) => d.value))

  return (
    <div className={`flex items-end gap-1.5 ${className}`}>
      {data.map((d, i) => {
        const percent = Math.round((d.value / max) * 100)
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
            <div
              className="w-full rounded-t-lg bg-surface-2 overflow-hidden flex flex-col justify-end"
              style={{ height: `${height}rem` }}
            >
              {d.value > 0 && (
                <div className="w-full rounded-t-lg" style={{ height: `${percent}%`, background: i === highlightIndex && highlightColor ? highlightColor : fill }} />
              )}
            </div>
            <span className="text-[11px] font-semibold text-text-muted truncate w-full text-center">{d.label}</span>
          </div>
        )
      })}
    </div>
  )
}
