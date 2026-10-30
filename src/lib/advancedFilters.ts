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
const matchesGenre = (item: FilterableBook, f: AdvancedFilters) =>
  f.genres.length === 0 || f.genres.some((g) => (item.genres ?? []).includes(g))

const matchesMood = (item: FilterableBook, f: AdvancedFilters) =>
  (f.moods.length === 0 && f.customMoods.length === 0) ||
  f.moods.some((m) => (item.moods ?? []).includes(m)) ||
  f.customMoods.some((m) => (item.custom_moods ?? []).some((bm) => sameText(bm, m)))

export function matchesTraitFilters(book: FilterableBook, bookTags: string[], f: AdvancedFilters): boolean {
  if (!matchesGenre(book, f) || !matchesMood(book, f)) return false
  if (f.pace && book.pace !== f.pace) return false
  if (f.tags.length > 0 && !f.tags.some((t) => bookTags.some((bt) => sameText(bt, t)))) return false
  return true
}

/** Separador Sagas (V.3.4.0): una saga entra si ella o alguno de sus libros tiene el género y
 *  el ánimo elegidos. El ritmo y las etiquetas son de cada libro y no filtran sagas. */
export function matchesSagaTraitFilters(saga: FilterableBook, sagaBooks: FilterableBook[], f: AdvancedFilters): boolean {
  const items = [saga, ...sagaBooks]
  return items.some((i) => matchesGenre(i, f)) && items.some((i) => matchesMood(i, f))
}
