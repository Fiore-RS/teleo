import { supabase } from './supabase'
import type { ReadingStatus } from './status'

// Estado automático de una saga en base al estado de los libros que la componen (books.saga_id).
// Se evalúa de arriba hacia abajo: gana la primera regla que aplique.
//   1. Todos terminados               -> terminado
//   2. Al menos 1 leyendo             -> leyendo
//   3. Al menos 1 abandonado          -> abandonado   (y ninguno leyendo)
//   4. Al menos 1 terminado (no todos)-> leyendo       (saga empezada, aunque ahora mismo no
//                                                        se esté leyendo nada de ella)
//   5. Al menos 1 pendiente           -> pendiente
//   6. Todos deseado (o sin libros)   -> deseado / pendiente
export function computeSagaStatus(bookStatuses: ReadingStatus[]): ReadingStatus {
  if (bookStatuses.length === 0) return 'pendiente'

  const has = (status: ReadingStatus) => bookStatuses.includes(status)
  const all = (status: ReadingStatus) => bookStatuses.every((s) => s === status)

  if (all('terminado')) return 'terminado'
  if (has('leyendo')) return 'leyendo'
  if (has('abandonado')) return 'abandonado'
  if (has('terminado')) return 'leyendo'
  if (has('pendiente')) return 'pendiente'
  return 'deseado'
}

// Recalcula y guarda el estado de una saga a partir de los libros que tiene asignados
// (saga_id). Se llama cada vez que algo puede haber cambiado ese cálculo: el estado de un
// libro de la saga, un libro que se agrega/quita de la saga, o un libro de la saga que se
// borra. Si la saga tiene el estado forzado a mano, esta llamada lo vuelve a pisar la
// próxima vez que ocurra uno de esos eventos (ver plan: no hay modo automático/manual
// separado, es siempre automático salvo que nada dispare el recálculo).
export async function recomputeSagaStatus(sagaId: string | null | undefined): Promise<void> {
  if (!sagaId) return
  const { data, error } = await supabase.from('books').select('status').eq('saga_id', sagaId)
  if (error) return
  const newStatus = computeSagaStatus((data ?? []).map((b) => b.status as ReadingStatus))
  await supabase.from('sagas').update({ status: newStatus }).eq('id', sagaId)
}
