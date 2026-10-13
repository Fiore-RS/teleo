import { supabase } from './supabase'
import type { LibrarySortMode } from './librarySort'

/** Orden de Cuaderno › Citas (V.3.1.0). El orden libre vive en favorite_quotes.cuaderno_sort_order
 *  (de menor a mayor); no confundir con sort_order, que es el orden dentro de cada reseña. */

interface SortableQuote {
  page: number | null
  created_at: string
  cuaderno_sort_order: number | null
  book: { title: string; author: string | null }
}

const compareText = (a: string, b: string) => a.localeCompare(b, 'es', { sensitivity: 'base' })
const byNewest = (a: SortableQuote, b: SortableQuote) => b.created_at.localeCompare(a.created_at)
const byPage = (a: SortableQuote, b: SortableQuote) => (a.page ?? Infinity) - (b.page ?? Infinity)

/** Ordena las citas según el modo. "fecha": de la más reciente a la más antigua (como venían
 *  antes de la V.3.1.0). "titulo" y "autor": por libro y, dentro del mismo libro, por página.
 *  "libre": el orden guardado; una cita sin orden todavía queda arriba. */
export function sortQuotes<T extends SortableQuote>(quotes: T[], mode: LibrarySortMode): T[] {
  const sorted = [...quotes]
  if (mode === 'fecha') return sorted.sort(byNewest)
  if (mode === 'titulo') {
    return sorted.sort((a, b) => compareText(a.book.title, b.book.title) || byPage(a, b) || byNewest(a, b))
  }
  if (mode === 'autor') {
    return sorted.sort((a, b) => {
      const authorA = a.book.author ?? ''
      const authorB = b.book.author ?? ''
      if (!authorA && authorB) return 1
      if (authorA && !authorB) return -1
      return compareText(authorA, authorB) || compareText(a.book.title, b.book.title) || byPage(a, b)
    })
  }
  return sorted.sort((a, b) => {
    if (a.cuaderno_sort_order === null && b.cuaderno_sort_order === null) return byNewest(a, b)
    if (a.cuaderno_sort_order === null) return -1
    if (b.cuaderno_sort_order === null) return 1
    return a.cuaderno_sort_order - b.cuaderno_sort_order
  })
}

/** Orden para una cita nueva: arriba de todas en el orden libre (decidido por Fiorella,
 *  13 oct 2026). Se usa en todos los lugares donde se crean citas. */
export async function topQuoteOrder(userId: string): Promise<number> {
  const { data } = await supabase
    .from('favorite_quotes')
    .select('cuaderno_sort_order, reviews!inner(user_id)')
    .eq('reviews.user_id', userId)
    .not('cuaderno_sort_order', 'is', null)
    .order('cuaderno_sort_order', { ascending: true })
    .limit(1)
  const min = data?.[0]?.cuaderno_sort_order
  return min == null ? 0 : min - 1000
}
