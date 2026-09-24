import { supabase } from '../lib/supabase'
import { queryClient } from '../lib/queryClient'
import { useCachedQuery } from './useCachedQuery'
import type { Database } from '../types/database'

export type Release = Database['public']['Tables']['releases']['Row']
export type ReleaseInput = Pick<Release, 'title' | 'author' | 'release_date' | 'place' | 'price' | 'book_id'>

const EMPTY: Release[] = []

/** Lanzamientos de la usuaria (fase 7), ordenados por fecha. Los usan la pantalla
 *  Lanzamientos, la tarjeta de Mesa y el detalle de un libro deseado. */
export function useReleases(userId: string | undefined) {
  const key = ['releases', userId]
  const { data: releases, isLoading } = useCachedQuery<Release[]>(
    key,
    async () => {
      const { data } = await supabase
        .from('releases')
        .select('*')
        .eq('user_id', userId!)
        .order('release_date', { ascending: true })
        .order('created_at', { ascending: true })
      return data ?? []
    },
    EMPTY,
    { enabled: !!userId }
  )

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ['releases'] })
  }

  /** El precio de un lanzamiento es el precio del libro: si está enlazado a un deseado, ese
   *  precio se guarda también en el libro, así aparece en su detalle y en "Completar deseados"
   *  de Bitácora. Va en una sola dirección: cambiar el precio en el detalle del libro (porque
   *  se compró en descuento o fue un regalo) no cambia el del lanzamiento, que queda como el
   *  precio original. Sin precio en el lanzamiento, el del libro no se borra. */
  async function syncBookPrice(input: ReleaseInput) {
    if (!input.book_id || input.price == null) return
    await supabase.from('books').update({ price: input.price }).eq('id', input.book_id)
    // El precio del libro se ve en varias pantallas (detalle, Compras, Estante...).
    await queryClient.invalidateQueries()
  }

  async function addRelease(input: ReleaseInput) {
    const { error } = await supabase.from('releases').insert({ ...input, user_id: userId! })
    if (!error) await syncBookPrice(input)
    await refresh()
    return !error
  }

  async function updateRelease(id: string, input: ReleaseInput) {
    const previous = releases.find((r) => r.id === id)
    const { error } = await supabase.from('releases').update(input).eq('id', id)
    // Al editar, el precio solo pasa al libro si cambió o si el libro se acaba de enlazar.
    // Así, editar la fecha o el lugar no pisa un precio que se cambió después en el libro.
    const priceChanged = previous?.price !== input.price
    const bookChanged = previous?.book_id !== input.book_id
    if (!error && (priceChanged || bookChanged)) await syncBookPrice(input)
    await refresh()
    return !error
  }

  async function deleteRelease(id: string) {
    const { error } = await supabase.from('releases').delete().eq('id', id)
    await refresh()
    return !error
  }

  return { releases, isLoading, addRelease, updateRelease, deleteRelease }
}
