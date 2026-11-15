import type { Breakpoint } from '../hooks/useBreakpoint'

/** Columnas de hojas en Cuaderno (reseñas y citas), V.4.0.0: dos en el celular, tres en tableta
 *  y cuatro en escritorio. Tiene que coincidir con las clases grid-cols-2 tableta:grid-cols-3
 *  escritorio:grid-cols-4 de esas cuadrículas. */
export function columnsFor(breakpoint: Breakpoint): number {
  if (breakpoint === 'escritorio') return 4
  if (breakpoint === 'tableta') return 3
  return 2
}

export function columnIndexes(count: number): number[] {
  return Array.from({ length: count }, (_, i) => i)
}
