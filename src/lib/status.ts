export type ReadingStatus = 'leyendo' | 'pendiente' | 'terminado' | 'abandonado' | 'deseado'

/** Colores icónicos de cada estado (ámbar, azul pizarra, verde, vino, gris). Se usan SOLO
 *  donde aparece el estado mismo: la esquina doblada (DogEar), la insignia de estado y el
 *  menú para cambiarlo, así siempre coinciden. El resto de la app usa la paleta. */
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
