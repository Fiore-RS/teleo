/** Rasgos de un libro (V.3.1.0): género, ánimo y ritmo. En la base se guardan las claves en
 *  inglés; las etiquetas en español salen de aquí (así Teleo en inglés solo traduce esto).
 *  Las claves y los máximos coinciden con las restricciones de la migración 0034. */

export type GenreKey =
  | 'fantasy'
  | 'romance'
  | 'scifi'
  | 'mystery'
  | 'thriller'
  | 'horror'
  | 'historical'
  | 'contemporary'
  | 'young_adult'
  | 'classics'
  | 'poetry'
  | 'nonfiction'
  | 'bl'
  | 'gl'

export type MoodKey =
  | 'adventurous'
  | 'funny'
  | 'emotional'
  | 'hopeful'
  | 'inspiring'
  | 'mysterious'
  | 'dark'
  | 'reflective'
  | 'relaxing'
  | 'romantic'
  | 'tense'
  | 'sad'

export type PaceKey = 'fast' | 'medium' | 'slow'

export interface TraitOption<K extends string> {
  key: K
  label: string
  /** Otras formas de nombrarlo: sirven para buscar y filtrar (ej. "mlm" encuentra BL). */
  aliases?: string[]
}

export const MAX_GENRES = 3
/** Máximo de ánimos por libro, sumando los fijos y los propios (custom_moods). */
export const MAX_MOODS = 3
/** Largo máximo de un ánimo propio. */
export const CUSTOM_MOOD_MAX_LENGTH = 24

export const genreOptions: TraitOption<GenreKey>[] = [
  { key: 'fantasy', label: 'Fantasía' },
  { key: 'romance', label: 'Romance' },
  { key: 'scifi', label: 'Ciencia ficción' },
  { key: 'mystery', label: 'Misterio' },
  { key: 'thriller', label: 'Thriller', aliases: ['suspenso'] },
  { key: 'horror', label: 'Terror' },
  { key: 'historical', label: 'Histórica' },
  { key: 'contemporary', label: 'Contemporánea' },
  { key: 'young_adult', label: 'Juvenil', aliases: ['young adult', 'ya'] },
  { key: 'classics', label: 'Clásicos' },
  { key: 'poetry', label: 'Poesía' },
  { key: 'nonfiction', label: 'No ficción' },
  { key: 'bl', label: 'BL', aliases: ['mlm', 'boys love', 'danmei', 'yaoi'] },
  { key: 'gl', label: 'GL', aliases: ['wlw', 'girls love', 'yuri', 'baihe'] },
]

export const moodOptions: TraitOption<MoodKey>[] = [
  { key: 'adventurous', label: 'Aventurero' },
  { key: 'funny', label: 'Divertido' },
  { key: 'emotional', label: 'Emotivo' },
  { key: 'hopeful', label: 'Esperanzador' },
  { key: 'inspiring', label: 'Inspirador' },
  { key: 'mysterious', label: 'Misterioso' },
  { key: 'dark', label: 'Oscuro' },
  { key: 'reflective', label: 'Reflexivo' },
  { key: 'relaxing', label: 'Relajante' },
  { key: 'romantic', label: 'Romántico' },
  { key: 'tense', label: 'Tenso' },
  { key: 'sad', label: 'Triste' },
]

export const paceOptions: TraitOption<PaceKey>[] = [
  { key: 'fast', label: 'Rápido' },
  { key: 'medium', label: 'Medio' },
  { key: 'slow', label: 'Lento' },
]

function labelFrom<K extends string>(options: TraitOption<K>[], key: string): string | null {
  return options.find((o) => o.key === key)?.label ?? null
}

export const genreLabel = (key: string) => labelFrom(genreOptions, key)
export const moodLabel = (key: string) => labelFrom(moodOptions, key)
export const paceLabel = (key: string) => labelFrom(paceOptions, key)

/** Minúsculas y sin tildes, para que "fantasia" o "MLM" encuentren su opción. */
function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

/** ¿La opción coincide con lo que se escribió (por etiqueta o por sinónimo)? */
export function traitMatches<K extends string>(option: TraitOption<K>, query: string): boolean {
  const q = normalize(query)
  if (!q) return true
  return [option.label, ...(option.aliases ?? [])].some((name) => normalize(name).includes(q))
}

/** Deja solo claves válidas, sin repetir y sin pasar el máximo (por si llega un respaldo viejo
 *  o algo inesperado de la base). */
export function cleanTraitKeys<K extends string>(keys: readonly string[] | null | undefined, options: TraitOption<K>[], max: number): K[] {
  const valid = new Set<string>(options.map((o) => o.key))
  return [...new Set((keys ?? []).filter((k) => valid.has(k)))].slice(0, max) as K[]
}

/** Ánimo fijo que corresponde a un texto escrito por la persona (por etiqueta o sinónimo, sin
 *  importar mayúsculas ni tildes), o null si es un ánimo nuevo. Así "oscuro" usa el fijo
 *  "Oscuro" en vez de crear uno propio repetido. */
export function moodKeyFromText(text: string): MoodKey | null {
  const q = normalize(text)
  if (!q) return null
  return moodOptions.find((o) => [o.label, ...(o.aliases ?? [])].some((name) => normalize(name) === q))?.key ?? null
}

/** Ánimo propio ya usado que coincide con el texto (sin importar mayúsculas ni tildes), para
 *  reusar "Cozy" si alguien escribe "cozy". */
export function findCustomMood(existing: readonly string[], text: string): string | null {
  const q = normalize(text)
  return existing.find((m) => normalize(m) === q) ?? null
}

/** Limpia los ánimos propios: sin espacios de más, sin vacíos, sin repetidos y recortados. */
export function cleanCustomMoods(moods: readonly string[] | null | undefined): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const raw of moods ?? []) {
    const mood = raw.trim().replace(/\s+/g, ' ').slice(0, CUSTOM_MOOD_MAX_LENGTH)
    const key = normalize(mood)
    if (!key || seen.has(key) || moodKeyFromText(mood)) continue
    seen.add(key)
    result.push(mood)
  }
  return result
}
