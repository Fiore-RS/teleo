import { tally, type CountEntry } from './tally'
import { traitsFromBook } from './bookTraits'
import { genreLabel, moodLabel, paceLabel } from './bookTraits'

/** Estadísticas de género, ánimo y ritmo (V.3.1.0). Cada libro cuenta una vez (una relectura no
 *  suma de nuevo). Solo se muestran con al menos MIN_BOOKS_FOR_TRAIT_STATS libros con el dato:
 *  con menos, los porcentajes no dicen mucho. */
export const MIN_BOOKS_FOR_TRAIT_STATS = 5

export interface TraitStats {
  genres: CountEntry[]
  moods: CountEntry[]
  paces: CountEntry[]
  /** Cuántos libros tienen cada dato, y cuántos libros hay en total. */
  withGenre: number
  withMood: number
  withPace: number
  total: number
}

interface TraitBook {
  id: string
  genres?: string[] | null
  moods?: string[] | null
  custom_moods?: string[] | null
  pace?: string | null
}

export function computeTraitStats(books: TraitBook[]): TraitStats {
  const unique = [...new Map(books.map((b) => [b.id, b])).values()]
  const traits = unique.map((b) => traitsFromBook(b))
  const withGenre = traits.filter((t) => t.genres.length > 0)
  const withMood = traits.filter((t) => t.moods.length + t.customMoods.length > 0)
  const withPace = traits.filter((t) => t.pace !== null)
  return {
    genres: tally(withGenre.flatMap((t) => t.genres.map(genreLabel))),
    moods: tally(withMood.flatMap((t) => [...t.moods.map(moodLabel), ...t.customMoods])),
    paces: tally(withPace.map((t) => (t.pace ? paceLabel(t.pace) : null))),
    withGenre: withGenre.length,
    withMood: withMood.length,
    withPace: withPace.length,
    total: unique.length,
  }
}

/** ¿Hay datos suficientes para mostrar al menos una parte? */
export function hasEnoughTraitData(stats: TraitStats): boolean {
  return Math.max(stats.withGenre, stats.withMood, stats.withPace) >= MIN_BOOKS_FOR_TRAIT_STATS
}
