/** Hash simple y estable de un texto (FNV-1a de 32 bits). */
function hashString(value: string): number {
  let hash = 2166136261
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

/** Elige `count` elementos "al azar" de la lista según una semilla. Con la misma semilla y
 *  los mismos elementos siempre sale lo mismo, aunque la lista llegue en otro orden o se
 *  vuelva a pedir a Supabase: así los libros no cambian mientras miras la pantalla, pero sí
 *  cambian la próxima vez que entras (nueva semilla). */
export function sampleWithSeed<T extends { id: string }>(list: T[], count: number, seed: number): T[] {
  if (list.length <= count) return list
  return [...list]
    .sort((a, b) => hashString(a.id + seed) - hashString(b.id + seed))
    .slice(0, count)
}
