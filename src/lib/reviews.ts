import type { Database } from '../types/database'

type Review = Database['public']['Tables']['reviews']['Row']

/** Columnas que dicen si una reseña ya se escribió (para pedirlas en un select). */
export const REVIEW_CONTENT_COLUMNS =
  'general_rating, general_comments, recommends, favorite_character_name, favorite_character_notes, favorite_character_photo_url, content_warnings, content_warnings_note'

export type ReviewContent = Pick<
  Review,
  | 'general_rating' | 'general_comments' | 'recommends' | 'favorite_character_name' | 'favorite_character_notes' | 'favorite_character_photo_url'
  | 'content_warnings' | 'content_warnings_note'
>

/** Desde Mis citas (V.2.1.0) se pueden anotar citas mientras se lee: esas citas cuelgan de
 *  una reseña que todavía no tiene nada más (un borrador). Una reseña cuenta como escrita
 *  cuando tiene calificación, comentario, recomendación, personaje favorito o avisos de
 *  contenido (V.2.1.1). Mientras sea
 *  borrador no aparece en Reseñas y el libro sigue ofreciendo "Crear reseña de lectura";
 *  al escribirla, las citas ya están ahí. */
export function isReviewWritten(review: ReviewContent | null | undefined): boolean {
  if (!review) return false
  return Boolean(
    (review.general_rating ?? 0) > 0 ||
      review.general_comments?.trim() ||
      review.recommends ||
      review.favorite_character_name?.trim() ||
      review.favorite_character_notes?.trim() ||
      review.favorite_character_photo_url ||
      (review.content_warnings?.length ?? 0) > 0 ||
      review.content_warnings_note?.trim()
  )
}
