import { supabase } from './supabase'

/** Registra una lectura completa en `reading_history` — se llama cada vez que un libro pasa
 *  a "terminado", sea la primera vez o tras una relectura. Es la fuente de verdad de "¿cuántos
 *  libros terminé en el año X?" (usada por "Mis años en libros" y la meta anual), separada del
 *  `end_date` actual del libro para que una relectura no borre el registro de cuándo se
 *  terminó la vez anterior. */
export async function recordBookCompletion(params: {
  bookId: string
  userId: string | undefined
  startDate: string | null
  endDate: string
}) {
  if (!params.userId) return
  await supabase.from('reading_history').insert({
    book_id: params.bookId,
    user_id: params.userId,
    start_date: params.startDate,
    end_date: params.endDate,
  })
}
