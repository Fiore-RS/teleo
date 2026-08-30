interface BarChartProps {
  data: { label: string; value: number }[]
  color?: string
  height?: number // alto de la zona de barras en rem
  className?: string
}

/** Barras simples dibujadas a mano (sin librería de gráficas), mismo lenguaje visual que
 *  ProgressBar: track en bg-border, relleno en un color de acento. Usado para el recap
 *  mensual/anual de Bitácora. */
export function BarChart({ data, color = 'var(--color-accent-reading)', height = 6, className = '' }: BarChartProps) {
  const max = Math.max(1, ...data.map((d) => d.value))

  return (
    <div className={`flex items-end gap-1.5 ${className}`}>
      {data.map((d, i) => {
        const percent = Math.round((d.value / max) * 100)
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
            <div
              className="w-full rounded-t-md bg-border overflow-hidden flex flex-col justify-end"
              style={{ height: `${height}rem` }}
            >
              {d.value > 0 && (
                <div className="w-full rounded-t-md" style={{ height: `${percent}%`, backgroundColor: color }} />
              )}
            </div>
            <span className="text-body-sm text-text-secondary truncate w-full text-center">{d.label}</span>
          </div>
        )
      })}
    </div>
  )
}
