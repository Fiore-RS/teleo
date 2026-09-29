/** Avisos de contenido de la reseña (V.2.1.1). En la base se guardan las claves; el texto
 *  que se muestra sale de acá, así se puede cambiar sin tocar los datos. El orden de esta
 *  lista es el orden en que se muestran. */
export const CONTENT_WARNINGS = [
  { key: 'violencia', label: 'Violencia' },
  { key: 'muerte', label: 'Muerte' },
  { key: 'abuso', label: 'Abuso' },
  { key: 'autolesion', label: 'Autolesión' },
  { key: 'drogas', label: 'Drogas' },
  { key: 'contenido_sexual', label: 'Contenido sexual' },
  { key: 'maltrato_animal', label: 'Maltrato animal' },
  { key: 'lenguaje_fuerte', label: 'Lenguaje fuerte' },
  { key: 'salud_mental', label: 'Salud mental' },
  { key: 'duelo', label: 'Duelo' },
  { key: 'enfermedad_grave', label: 'Enfermedad grave' },
  { key: 'discriminacion', label: 'Discriminación' },
] as const

/** Las claves guardadas, en el orden de la lista y sin claves desconocidas. */
export function sortedWarnings(keys: readonly string[] | null | undefined) {
  const set = new Set(keys ?? [])
  return CONTENT_WARNINGS.filter((w) => set.has(w.key))
}
