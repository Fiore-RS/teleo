import { supabase } from './supabase'
import {
  MAX_GENRES,
  MAX_MOODS,
  cleanCustomMoods,
  cleanTraitKeys,
  genreOptions,
  moodOptions,
  normalizeTraitText,
  type GenreKey,
  type MoodKey,
} from './bookTraits'

// Género y ánimo por saga (V.3.4.0). La saga guarda su género y su ánimo, y se copian a cada
// libro (no se leen en vivo): así filtros, estadísticas y el resumen siguen leyendo books. El
// ritmo queda solo por libro. Cada libro marca de dónde vino cada dato (genres_source y
// moods_source):
//   - 'saga': lo tomó de su saga; si la saga cambia, cambia con ella.
//   - 'manual': lo puso la persona; la saga no lo toca sin preguntar.
//   - 'suggested' (solo género): sugerencia automática; la saga lo reemplaza sin preguntar.
//   - vacío: no tiene el dato. Un libro con datos y sin marca (de antes de la 0037) cuenta como
//     'manual'.
// Reglas, por separado para género y para ánimo (decididas con Fiorella, 20 y 27 oct 2026):
//   1. La saga tiene el dato:
//      - libro vacío, 'saga' o 'suggested' -> recibe el de la saga ('saga'), sin preguntar.
//      - libro 'manual' igual al de la saga -> pasa a 'saga' (ya coinciden).
//      - libro 'manual' distinto -> conflicto: se pregunta una sola vez; con "Cambiar todos" /
//        "Usar los de la saga" recibe el de la saga y pasa a 'saga'.
//   2. La saga no tiene el dato (nunca lo tuvo o se borró): los libros 'saga' conservan el suyo
//      y pasan a 'manual'. Nadie pierde datos por borrar algo en la saga.
//   3. Un libro que sale de la saga conserva lo que tenía y pasa a 'manual'.

export type SagaTraitField = 'genre' | 'mood'

export interface SagaTraits {
  genres: GenreKey[]
  moods: MoodKey[]
  customMoods: string[]
}

export const EMPTY_SAGA_TRAITS: SagaTraits = { genres: [], moods: [], customMoods: [] }

interface SagaTraitColumns {
  genres?: string[] | null
  moods?: string[] | null
  custom_moods?: string[] | null
}

/** Género y ánimo de una saga tal como vienen de la base, limpios. */
export function sagaTraitsFromRow(row: SagaTraitColumns | null | undefined): SagaTraits {
  if (!row) return EMPTY_SAGA_TRAITS
  const moods = cleanTraitKeys(row.moods, moodOptions, MAX_MOODS)
  return {
    genres: cleanTraitKeys(row.genres, genreOptions, MAX_GENRES),
    moods,
    customMoods: cleanCustomMoods(row.custom_moods).slice(0, MAX_MOODS - moods.length),
  }
}

/** Columnas de la saga a guardar. */
export function sagaTraitsToColumns(traits: SagaTraits) {
  const moods = traits.moods.slice(0, MAX_MOODS)
  return {
    genres: traits.genres.slice(0, MAX_GENRES),
    moods,
    custom_moods: cleanCustomMoods(traits.customMoods).slice(0, MAX_MOODS - moods.length),
  }
}

export const hasSagaTraits = (t: SagaTraits) => t.genres.length + t.moods.length + t.customMoods.length > 0

/** Lo que hace falta de un libro para comparar con su saga. */
export interface TraitBook {
  id: string
  title?: string
  genres: string[] | null
  moods: string[] | null
  custom_moods: string[] | null
  genres_source: string | null
  moods_source: string | null
}

export const TRAIT_BOOK_COLUMNS = 'id, title, genres, moods, custom_moods, genres_source, moods_source'

interface BookTraitUpdate {
  genres?: string[]
  genres_source?: string | null
  moods?: string[]
  custom_moods?: string[]
  moods_source?: string | null
}

export interface BookTraitPlan {
  bookId: string
  /** Lo que se guarda sin preguntar (puede estar vacío). */
  update: BookTraitUpdate
  /** Datos en que el libro tiene otro valor puesto a mano. */
  conflicts: SagaTraitField[]
  /** Lo que se guarda además si la persona elige usar los de la saga. */
  override: BookTraitUpdate
}

const sameList = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && [...a].sort().join('|') === [...b].sort().join('|')

const moodSignature = (moods: readonly string[], custom: readonly string[]) => [
  ...moods,
  ...custom.map((m) => `own:${normalizeTraitText(m)}`),
]

/** De dónde vino el dato. Con datos y sin marca (libros de antes de la 0037) es 'manual'. */
function effectiveSource(hasValue: boolean, source: string | null): string | null {
  if (!hasValue) return null
  return source ?? 'manual'
}

export const ALL_TRAIT_FIELDS: SagaTraitField[] = ['genre', 'mood']

/** Qué datos cambiaron entre dos versiones de la saga: solo esos se pasan a los libros (y solo
 *  por esos se pregunta), así guardar la saga sin tocar el ánimo no vuelve a preguntar por él. */
export function changedTraitFields(before: SagaTraits, after: SagaTraits): SagaTraitField[] {
  const fields: SagaTraitField[] = []
  if (!sameList(before.genres, after.genres)) fields.push('genre')
  if (!sameList(moodSignature(before.moods, before.customMoods), moodSignature(after.moods, after.customMoods))) fields.push('mood')
  return fields
}

/** Qué pasa con un libro frente al género y ánimo de su saga. Pura: no guarda nada. `fields`
 *  limita a género o ánimo. */
export function planBookTraits(book: TraitBook, saga: SagaTraits, fields: SagaTraitField[] = ALL_TRAIT_FIELDS): BookTraitPlan {
  const plan: BookTraitPlan = { bookId: book.id, update: {}, conflicts: [], override: {} }

  // Género
  if (fields.includes('genre')) {
  const bookGenres = book.genres ?? []
  const genreSource = effectiveSource(bookGenres.length > 0, book.genres_source)
  if (saga.genres.length === 0) {
    if (book.genres_source === 'saga') plan.update.genres_source = bookGenres.length > 0 ? 'manual' : null
  } else if (genreSource === 'manual') {
    if (sameList(bookGenres, saga.genres)) plan.update.genres_source = 'saga'
    else {
      plan.conflicts.push('genre')
      plan.override.genres = saga.genres
      plan.override.genres_source = 'saga'
    }
  } else if (!sameList(bookGenres, saga.genres) || book.genres_source !== 'saga') {
    plan.update.genres = saga.genres
    plan.update.genres_source = 'saga'
  }
  }

  // Ánimo (fijos y propios juntos)
  if (fields.includes('mood')) {
  const bookMoods = book.moods ?? []
  const bookCustom = book.custom_moods ?? []
  const bookSig = moodSignature(bookMoods, bookCustom)
  const sagaSig = moodSignature(saga.moods, saga.customMoods)
  const moodSource = effectiveSource(bookSig.length > 0, book.moods_source)
  const sagaMoods = { moods: saga.moods, custom_moods: saga.customMoods }
  if (sagaSig.length === 0) {
    if (book.moods_source === 'saga') plan.update.moods_source = bookSig.length > 0 ? 'manual' : null
  } else if (moodSource === 'manual') {
    if (sameList(bookSig, sagaSig)) plan.update.moods_source = 'saga'
    else {
      plan.conflicts.push('mood')
      Object.assign(plan.override, sagaMoods, { moods_source: 'saga' })
    }
  } else if (!sameList(bookSig, sagaSig) || book.moods_source !== 'saga') {
    Object.assign(plan.update, sagaMoods, { moods_source: 'saga' })
  }
  }

  return plan
}

export interface SagaTraitConflict {
  book: TraitBook
  fields: SagaTraitField[]
}

/** Libros con otro género o ánimo puesto a mano, para preguntar antes de aplicar. */
export function findTraitConflicts(books: TraitBook[], saga: SagaTraits, fields: SagaTraitField[] = ALL_TRAIT_FIELDS): SagaTraitConflict[] {
  return books
    .map((book) => ({ book, fields: planBookTraits(book, saga, fields).conflicts }))
    .filter((c) => c.fields.length > 0)
}

async function fetchTraitBooks(sagaId: string, bookIds?: string[]): Promise<TraitBook[]> {
  let query = supabase.from('books').select(TRAIT_BOOK_COLUMNS).eq('saga_id', sagaId)
  if (bookIds) query = query.in('id', bookIds)
  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as TraitBook[]
}

/** Libros de la saga que tienen otro género o ánimo puesto a mano. `bookIds` limita la
 *  búsqueda (por ejemplo, a los libros que se acaban de sumar). */
export async function fetchSagaTraitConflicts(
  sagaId: string,
  saga: SagaTraits,
  { bookIds, fields = ALL_TRAIT_FIELDS }: { bookIds?: string[]; fields?: SagaTraitField[] } = {},
): Promise<SagaTraitConflict[]> {
  return findTraitConflicts(await fetchTraitBooks(sagaId, bookIds), saga, fields)
}

/** Pasa el género y ánimo de la saga a sus libros con las reglas de arriba. Con
 *  `useSagaForConflicts`, los libros con otro dato puesto a mano también toman los de la saga.
 *  `bookIds` limita a esos libros y `fields` a género o ánimo. */
export async function applySagaTraits(
  sagaId: string,
  saga: SagaTraits,
  {
    useSagaForConflicts = false,
    bookIds,
    fields = ALL_TRAIT_FIELDS,
  }: { useSagaForConflicts?: boolean; bookIds?: string[]; fields?: SagaTraitField[] } = {},
): Promise<void> {
  if (fields.length === 0) return
  const books = await fetchTraitBooks(sagaId, bookIds)
  const updates = books
    .map((book) => {
      const plan = planBookTraits(book, saga, fields)
      return { id: book.id, cols: useSagaForConflicts ? { ...plan.update, ...plan.override } : plan.update }
    })
    .filter((u) => Object.keys(u.cols).length > 0)
  const results = await Promise.all(updates.map((u) => supabase.from('books').update(u.cols).eq('id', u.id)))
  const failed = results.find((r) => r.error)
  if (failed?.error) throw failed.error
}

/** Un libro que sale de su saga conserva su género y ánimo, ahora como puestos a mano. Llamar
 *  antes o después de quitarle el saga_id. */
export async function releaseBookTraits(bookIds: string[]): Promise<void> {
  if (bookIds.length === 0) return
  const results = await Promise.all([
    supabase.from('books').update({ genres_source: 'manual' }).in('id', bookIds).eq('genres_source', 'saga'),
    supabase.from('books').update({ moods_source: 'manual' }).in('id', bookIds).eq('moods_source', 'saga'),
  ])
  const failed = results.find((r) => r.error)
  if (failed?.error) throw failed.error
}
