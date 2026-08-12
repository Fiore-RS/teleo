export type ReadingStatus = 'leyendo' | 'pendiente' | 'terminado' | 'abandonado' | 'deseado'

export const statusColorVar: Record<ReadingStatus, string> = {
  leyendo: 'var(--color-accent-reading)',
  pendiente: 'var(--color-state-pending)',
  terminado: 'var(--color-accent-finished)',
  deseado: 'var(--color-accent-wishlist)',
  abandonado: 'var(--color-state-abandoned)',
}

export const statusLabel: Record<ReadingStatus, string> = {
  leyendo: 'Leyendo',
  pendiente: 'Pendiente',
  terminado: 'Terminado',
  deseado: 'Deseado',
  abandonado: 'Abandonado',
}