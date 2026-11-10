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
