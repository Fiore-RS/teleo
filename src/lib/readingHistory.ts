import { supabase } from './supabase'

/* Reglas del reto anual (decididas con las beta-testers, 23 de septiembre de 2026):
 * - Cuenta todo libro terminado con fecha de fin, en el año de esa fecha.
 * - Alcanza con la fecha de fin; la de inicio es opcional.
 * - Sin fecha de fin exacta ("no recuerdo"), el libro no cuenta.
 * `reading_history` es la fuente de verdad del reto, de "Mis años en libros" y del Resumen:
 * cada fila es una lectura completa (las relecturas suman una fila más). */

/** Registra una lectura completa nueva: se llama cada vez que un libro PASA a "terminado"
 *  (primera vez o relectura), desde cualquier lugar de la app. Sin fecha de fin no registra
 *  nada, así ese libro no cuenta para el reto. */
export async function recordBookCompletion(params: {
  bookId: string
  userId: string | undefined
  startDate: string | null
  endDate: string | null
}) {
  if (!params.userId || !params.endDate) return
  await supabase.from('reading_history').insert({
    book_id: params.bookId,
    user_id: params.userId,
    start_date: params.startDate,
    end_date: params.endDate,
  })
}

/** Cuando se EDITAN las fechas de un libro que ya estaba terminado (en Editar detalles o en la
 *  reseña), la lectura más reciente del historial se ajusta a esas fechas: se actualiza si
 *  existe, se crea si faltaba y se borra si ahora no hay fecha de fin. Así el reto siempre
 *  cuenta el libro en el año correcto. */
export async function syncLatestReading(params: {
  bookId: string
  userId: string | undefined
  startDate: string | null
  endDate: string | null
}) {
  if (!params.userId) return
  const { data: latest } = await supabase
    .from('reading_history')
    .select('id')
    .eq('book_id', params.bookId)
    .order('end_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!params.endDate) {
    if (latest) await supabase.from('reading_history').delete().eq('id', latest.id)
    return
  }

  if (latest) {
    await supabase
      .from('reading_history')
      .update({ start_date: params.startDate, end_date: params.endDate })
      .eq('id', latest.id)
  } else {
    await recordBookCompletion(params)
  }
}
