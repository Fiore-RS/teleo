import { formatOptions } from './options'

export interface CountEntry {
  label: string
  count: number
}

/** Cuenta cuántas veces aparece cada valor (ignora vacíos), de mayor a menor. */
export function tally(values: (string | null | undefined)[]): CountEntry[] {
  const counts = new Map<string, number>()
  for (const v of values) {
    if (!v) continue
    counts.set(v, (counts.get(v) ?? 0) + 1)
  }
  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
}

// El formato se guarda como clave (fisico, audiolibro); se muestra con su nombre.
const formatLabels = new Map<string, string>(formatOptions.map((o) => [o.value, o.label]))

export function formatLabel(format: string | null | undefined): string | null {
  return format ? formatLabels.get(format) ?? format : null
}
