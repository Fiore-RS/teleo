import type { Json } from '../types/database'

/** Marcas de la app guardadas en la cuenta (V.3.7.2, columna profiles.ui_marks de la 0040):
 *  lo que la persona ya vio o eligió, para que no dependa del dispositivo. Antes vivían en
 *  localStorage, que pertenece a la dirección: con la mudanza a teleo.fiorers.dev (V.4.0.0)
 *  se habrían perdido. Además así son las mismas en el celular y en la computadora.
 *
 *  - metaCelebrada: postal de la meta cumplida ya vista, por año (V.3.6.0).
 *  - anuncioResumen: anuncio de diciembre del resumen del año ya visto, por año (V.3.2.0).
 *  - loTengoOfrecido: hoja para marcar los libros físicos con "Lo tengo" ya ofrecida (V.3.7.0).
 *  - completeShelfSkipped: libros saltados en "Completa tu estante" (V.3.1.0).
 *  - sortModes: modo de organizar de cada lista (Estante libros y sagas, Cuaderno reseñas y
 *    citas).
 *
 *  El avance de la sugerencia de géneros (GenreSuggestSheet) se queda en el dispositivo: es un
 *  trabajo en curso que puede guardar cientos de libros y no vale la pena cargarlo con el
 *  perfil. Si se pierde con la mudanza, se puede volver a correr. */
export interface UiMarks {
  metaCelebrada?: Record<string, string>
  anuncioResumen?: Record<string, string>
  loTengoOfrecido?: string
  completeShelfSkipped?: string[]
  sortModes?: Record<string, string>
}

const isRecord = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)

function stringRecord(v: unknown): Record<string, string> | undefined {
  if (!isRecord(v)) return undefined
  const out: Record<string, string> = {}
  for (const [k, val] of Object.entries(v)) if (typeof val === 'string') out[k] = val
  return out
}

/** Lee ui_marks del perfil sin confiar en su forma (es un jsonb libre). */
export function parseUiMarks(value: Json | null | undefined): UiMarks {
  if (!isRecord(value)) return {}
  const marks: UiMarks = {}
  const meta = stringRecord(value.metaCelebrada)
  if (meta) marks.metaCelebrada = meta
  const recap = stringRecord(value.anuncioResumen)
  if (recap) marks.anuncioResumen = recap
  if (typeof value.loTengoOfrecido === 'string') marks.loTengoOfrecido = value.loTengoOfrecido
  if (Array.isArray(value.completeShelfSkipped)) {
    marks.completeShelfSkipped = value.completeShelfSkipped.filter((id): id is string => typeof id === 'string')
  }
  const sort = stringRecord(value.sortModes)
  if (sort) marks.sortModes = sort
  return marks
}

/** Junta un cambio con las marcas actuales, con la misma regla que merge_ui_marks (0041): las
 *  claves que son objeto en los dos lados se juntan; el resto, gana lo que llega. Se usa para
 *  mostrar el cambio enseguida (antes de que responda la base) y en la cuenta de visitante. */
export function mergeUiMarks(base: UiMarks, patch: UiMarks): UiMarks {
  const out: Record<string, unknown> = { ...base }
  for (const [k, val] of Object.entries(patch)) {
    const prev = (base as Record<string, unknown>)[k]
    out[k] = isRecord(prev) && isRecord(val) ? { ...prev, ...val } : val
  }
  return out as UiMarks
}

// Cuenta de visitante --------------------------------------------------------------------
// La comparte todo el mundo, así que sus marcas no van a la cuenta (la base de datos tampoco
// lo permite): se quedan en el dispositivo, con la misma forma.

const localKey = (userId: string) => `teleo:uiMarks:${userId}`

export function readLocalUiMarks(userId: string): UiMarks {
  try {
    return parseUiMarks(JSON.parse(localStorage.getItem(localKey(userId)) ?? '{}') as Json)
  } catch {
    return {}
  }
}

export function writeLocalUiMarks(userId: string, marks: UiMarks) {
  try {
    localStorage.setItem(localKey(userId), JSON.stringify(marks))
  } catch {
    // Sin almacenamiento (modo privado): las marcas duran mientras la app siga abierta.
  }
}

// Subida única desde el dispositivo (V.3.7.2) ---------------------------------------------
// Cada dispositivo sube una sola vez lo que tenía guardado antes de la 3.7.2. Las claves
// viejas se dejan donde estaban: ya no se leen, y no molestan.

const uploadedKey = (userId: string) => `teleo:prefsSubidas:${userId}`

export function wereLocalPrefsUploaded(userId: string): boolean {
  try {
    return localStorage.getItem(uploadedKey(userId)) !== null
  } catch {
    // Sin almacenamiento tampoco hay nada viejo que subir.
    return true
  }
}

export function markLocalPrefsUploaded(userId: string) {
  try {
    localStorage.setItem(uploadedKey(userId), new Date().toISOString())
  } catch {
    // Sin almacenamiento: no pasa nada.
  }
}

/** Arma el cambio con lo que este dispositivo guardaba antes de la 3.7.2. Los saltados de
 *  "Completa tu estante" se unen con los de la cuenta; un modo de organizar solo se sube si la
 *  cuenta todavía no tiene uno para esa lista (el primer dispositivo manda). */
export function collectLegacyUiMarks(userId: string, current: UiMarks): UiMarks {
  const patch: UiMarks = {}
  let keys: string[]
  try {
    keys = Object.keys(localStorage)
  } catch {
    return patch
  }
  const get = (k: string) => {
    try {
      return localStorage.getItem(k)
    } catch {
      return null
    }
  }

  const metaPrefix = `teleo:metaCelebrada:${userId}:`
  const recapPrefix = `teleo-anuncio-resumen-${userId}-`
  const sortPrefix = 'teleo:sortMode:'

  for (const k of keys) {
    const value = get(k)
    if (value === null) continue
    if (k.startsWith(metaPrefix)) {
      patch.metaCelebrada = { ...patch.metaCelebrada, [k.slice(metaPrefix.length)]: value }
    } else if (k.startsWith(recapPrefix)) {
      patch.anuncioResumen = { ...patch.anuncioResumen, [k.slice(recapPrefix.length)]: value }
    } else if (k === `teleo:loTengoOfrecido:${userId}` && !current.loTengoOfrecido) {
      patch.loTengoOfrecido = value
    } else if (k === `teleo:completeShelf:skipped:${userId}`) {
      try {
        const ids = (JSON.parse(value) as unknown[]).filter((id): id is string => typeof id === 'string')
        const merged = Array.from(new Set([...(current.completeShelfSkipped ?? []), ...ids]))
        if (merged.length > (current.completeShelfSkipped?.length ?? 0)) patch.completeShelfSkipped = merged
      } catch {
        // Lista dañada: se ignora.
      }
    } else if (k.startsWith(sortPrefix)) {
      const list = k.slice(sortPrefix.length)
      if (!current.sortModes?.[list]) patch.sortModes = { ...patch.sortModes, [list]: value }
    }
  }
  return patch
}

export const hasMarks = (marks: UiMarks) => Object.keys(marks).length > 0
