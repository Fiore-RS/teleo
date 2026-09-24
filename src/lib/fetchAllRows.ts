import type { PostgrestError } from '@supabase/supabase-js'

const PAGE_SIZE = 1000

/** Trae TODAS las filas de una consulta, de 1000 en 1000. Supabase devuelve como máximo 1000
 *  filas por pedido, así que sin esto un respaldo con muchos días de racha (o muchos libros)
 *  quedaría cortado sin avisar. `page` arma la consulta de nuevo en cada vuelta, con un orden
 *  fijo para que las páginas no se mezclen. */
export async function fetchAllRows<T>(
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: PostgrestError | null }>
): Promise<T[]> {
  const rows: T[] = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await page(from, from + PAGE_SIZE - 1)
    if (error) throw error
    rows.push(...(data ?? []))
    if (!data || data.length < PAGE_SIZE) return rows
  }
}
