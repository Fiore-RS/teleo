import type { UiMarks } from './uiMarks'

/** "Lo tengo" (V.3.7.0). Al sacar un libro de Deseados (normalmente porque se compró), si es
 *  físico queda marcado solo. Si ya estaba marcado, no es físico o el cambio ya decide la marca
 *  (por ejemplo, desde Editar libro), no se toca. */
export function ownedOnLeavingWishlist(
  book: { status: string; format: string | null; owned?: boolean | null },
  changes: { status?: string; format?: string | null; owned?: boolean }
): { owned?: true } {
  const leavesWishlist = book.status === 'deseado' && !!changes.status && changes.status !== 'deseado'
  if (!leavesWishlist || 'owned' in changes || book.owned) return {}
  return (changes.format ?? book.format) === 'fisico' ? { owned: true } : {}
}

/** V.4.6.0: empezar una lectura en físico marca "Lo tengo" (si no estaba marcado), igual que
 *  sacar un libro físico de Deseados. "Lo tengo" sigue siendo del libro, no de la lectura. */
export function ownedOnStartingPhysical(
  book: { owned?: boolean | null },
  patch: { format?: string | null }
): { owned?: true } {
  return patch.format === 'fisico' && !book.owned ? { owned: true } : {}
}

/** Hoja de Mesa que ofrece marcar con "Lo tengo" los libros físicos que ya estaban en la
 *  biblioteca (V.3.7.0). Sale una sola vez; después queda el atajo en Configuración › Tus
 *  datos. Desde la V.3.7.2 se recuerda en la cuenta (ui_marks.loTengoOfrecido). */
export function wasOwnedOffered(marks: UiMarks): boolean {
  return !!marks.loTengoOfrecido
}

export function ownedOfferedPatch(): UiMarks {
  return { loTengoOfrecido: new Date().toISOString() }
}
