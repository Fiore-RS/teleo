import { ProgressBar } from '../atoms/ProgressBar'

export interface BreakdownEntry {
  label: string
  count: number
}

/** Lista con barras para un desglose (por categoría, formato, idioma...), de mayor a menor.
 *  Se usa en Estadísticas y en el Resumen del año de Bitácora. */
export function BreakdownList({ title, entries }: { title: string; entries: BreakdownEntry[] }) {
  if (entries.length === 0) return null
  const total = entries.reduce((sum, e) => sum + e.count, 0)
  return (
    <div>
      <p className="font-body font-semibold text-body-md text-text mb-2.5">{title}</p>
      <div className="space-y-2.5">
        {entries.map((e) => (
          <div key={e.label}>
            <div className="flex items-center justify-between text-body-sm text-text mb-1">
              <span className="truncate">{e.label}</span>
              <span className="text-text-secondary shrink-0 ml-2 tabular-nums">{e.count}</span>
            </div>
            <ProgressBar percent={total > 0 ? (e.count / total) * 100 : 0} />
          </div>
        ))}
      </div>
    </div>
  )
}
