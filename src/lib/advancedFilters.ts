import type { ReadingStatus } from './status'
import type { GenreKey, MoodKey, PaceKey } from './bookTraits'

/** Filtros avanzados de Estante (FilterModal). Viven aparte del componente para que el
 *  archivo del modal solo exporte componentes (recarga rápida de Vite).
 *  Desde la V.3.1.0 también género, ánimo, ritmo y etiquetas: dentro de cada grupo basta con
 *  que el libro tenga uno de los elegidos; entre grupos, tiene que cumplir todos. */
export interface AdvancedFilters {
  status: 'todos' | ReadingStatus
  language: string
  category: string
  format: string
  genres: GenreKey[]
  moods: MoodKey[]
  /** Ánimos propios (texto libre), aparte de los fijos. */
  customMoods: string[]
  pace: PaceKey | null
  tags: string[]
}

export const defaultAdvancedFilters: AdvancedFilters = {
  status: 'todos',
  language: 'todos',
  category: 'todos',
  format: 'todos',
  genres: [],
  moods: [],
  customMoods: [],
  pace: null,
  tags: [],
}

/** ¿Hay algún filtro puesto? */
export function hasActiveFilters(f: AdvancedFilters): boolean {
  return (
    f.status !== 'todos' ||
    f.language !== 'todos' ||
    f.category !== 'todos' ||
    f.format !== 'todos' ||
    f.genres.length > 0 ||
    f.moods.length > 0 ||
    f.customMoods.length > 0 ||
    f.pace !== null ||
    f.tags.length > 0
  )
}

interface FilterableBook {
  genres?: string[] | null
  moods?: string[] | null
  custom_moods?: string[] | null
  pace?: string | null
}

const sameText = (a: string, b: string) =>
  a.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim() ===
  b.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

/** Género, ánimo, ritmo y etiquetas (lo demás lo filtra Estante como siempre). */
export function matchesTraitFilters(book: FilterableBook, bookTags: string[], f: AdvancedFilters): boolean {
  if (f.genres.length > 0 && !f.genres.some((g) => (book.genres ?? []).includes(g))) return false
  if (f.moods.length > 0 || f.customMoods.length > 0) {
    const fixed = f.moods.some((m) => (book.moods ?? []).includes(m))
    const own = f.customMoods.some((m) => (book.custom_moods ?? []).some((bm) => sameText(bm, m)))
    if (!fixed && !own) return false
  }
  if (f.pace && book.pace !== f.pace) return false
  if (f.tags.length > 0 && !f.tags.some((t) => bookTags.some((bt) => sameText(bt, t)))) return false
  return true
}
