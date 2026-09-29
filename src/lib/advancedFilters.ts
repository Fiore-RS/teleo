import type { ReadingStatus } from './status'

/** Filtros avanzados de Estante (FilterModal). Viven aparte del componente para que el
 *  archivo del modal solo exporte componentes (recarga rápida de Vite). */
export interface AdvancedFilters {
  status: 'todos' | ReadingStatus
  language: string
  category: string
  format: string
}

export const defaultAdvancedFilters: AdvancedFilters = {
  status: 'todos',
  language: 'todos',
  category: 'todos',
  format: 'todos',
}
