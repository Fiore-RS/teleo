import { supabase } from './supabase'
import { recomputeSagaStatus } from './sagaStatus'
import { todayLocalDate } from './date'

/** "Sigue en la saga" (V.3.1.0): al terminar un libro de una saga, Teleo propone el siguiente
 *  si está en pendientes ("Empezar a leerlo") o en deseados ("Pasar a pendientes"). */
export interface NextInSaga {
  id: string
  title: string
  author: string | null
  cover_url: string | null
  status: 'pendiente' | 'deseado'
  /** Número dentro de la saga (1, 2, 3...). */
  position: number
  sagaId: string
  sagaTitle: string
}

interface SagaBook {
  id: string
  title: string
  author: string | null
  cover_url: string | null
  status: string
}

/** El siguiente libro de la saga (en su orden) que todavía no se terminó, si está en pendientes
 *  o en deseados. Si el siguiente ya se está leyendo, está en pausa o se abandonó, no se propone
 *  nada. `books` tiene que venir ordenado por saga_sort_order (como lo da useSaga). */
export function findNextInSaga(
  bookId: string,
  saga: { id: string; title: string } | null,
  books: SagaBook[]
): NextInSaga | null {
  if (!saga) return null
  const index = books.findIndex((b) => b.id === bookId)
  if (index < 0) return null
  const offset = books.slice(index + 1).findIndex((b) => b.status !== 'terminado')
  if (offset < 0) return null
  const next = books[index + 1 + offset]
  if (next.status !== 'pendiente' && next.status !== 'deseado') return null
  return {
    id: next.id,
    title: next.title,
    author: next.author,
    cover_url: next.cover_url,
    status: next.status,
    position: index + 2 + offset,
    sagaId: saga.id,
    sagaTitle: saga.title,
  }
}

/** Avanza el siguiente libro: de pendientes a Leyendo (con la fecha de hoy como inicio) o de
 *  deseados a pendientes. Recalcula el estado de la saga. */
export async function advanceNextInSaga(next: NextInSaga): Promise<void> {
  const update = next.status === 'pendiente'
    ? { status: 'leyendo', start_date: todayLocalDate() }
    : { status: 'pendiente' }
  await supabase.from('books').update(update).eq('id', next.id)
  await recomputeSagaStatus(next.sagaId)
}
