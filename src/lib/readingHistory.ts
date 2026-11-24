import { supabase } from './supabase'

/* Reglas del reto anual (decididas con las beta-testers, 23 de septiembre de 2026):
 * - Cuenta todo libro terminado con fecha de fin, en el año de esa fecha.
 * - Alcanza con la fecha de fin; la de inicio es opcional.
 * - Sin fecha de fin exacta ("no recuerdo"), el libro no cuenta.
 * `reading_history` es la fuente de verdad del reto, de "Mis años en libros" y del Resumen:
 * cada fila es una lectura completa (las relecturas suman una fila más).
 * Desde la V.4.6.0 cada fila guarda también con qué formato se hizo esa lectura (el de
 * `books.format` al terminar, que es el de la lectura en curso). */

/** Registra una lectura completa nueva: se llama cada vez que un libro PASA a "terminado"
 *  (primera vez o relectura), desde cualquier lugar de la app. Sin fecha de fin no registra
 *  nada, así ese libro no cuenta para el reto. */
export async function recordBookCompletion(params: {
  bookId: string
  userId: string | undefined
  startDate: string | null
  endDate: string | null
  /** Formato de esta lectura (V.4.6.0). */
  format: string | null
}) {
  if (!params.userId || !params.endDate) return
  await supabase.from('reading_history').insert({
    book_id: params.bookId,
    user_id: params.userId,
    start_date: params.startDate,
    end_date: params.endDate,
    format: params.format,
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
  /** Formato de la lectura en curso (V.4.6.0); se guarda también en la más reciente. */
  format: string | null
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
      .update({ start_date: params.startDate, end_date: params.endDate, format: params.format })
      .eq('id', latest.id)
  } else {
    await recordBookCompletion(params)
  }
}

/** Cambia el formato de una lectura ya registrada (Editar libro › Lecturas anteriores, V.4.6.0). */
export async function updateReadingFormat(readingId: string, format: string | null) {
  return supabase.from('reading_history').update({ format }).eq('id', readingId)
}

/** Formato de una lectura del historial (V.4.6.0). Las filas de antes de la migración 0044, o
 *  las que se crearon sin él, toman el del libro. */
export function readingFormatOf(rowFormat: string | null | undefined, bookFormat: string | null | undefined): string | null {
  return rowFormat ?? bookFormat ?? null
}

/** Cuánto suma una lectura según su formato (V.4.6.0): las de audiolibro suman tiempo
 *  escuchado y las demás, páginas. Antes se miraba el formato actual del libro, así que
 *  cambiarlo cambiaba también las lecturas viejas. */
export function readingAmounts(
  format: string | null,
  book: { total_pages: number | null; total_duration_seconds: number | null }
): { pages: number; audioSeconds: number } {
  return format === 'audiolibro'
    ? { pages: 0, audioSeconds: book.total_duration_seconds ?? 0 }
    : { pages: book.total_pages ?? 0, audioSeconds: 0 }
}
