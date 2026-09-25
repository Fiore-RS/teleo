import { supabase } from '../lib/supabase'
import { useCachedQuery } from './useCachedQuery'
import type { ReadingStatus } from '../lib/status'

export interface PurchaseBook {
  id: string
  title: string
  author: string | null
  coverUrl: string | null
  status: ReadingStatus
  price: number | null
  purchaseDate: string | null
  isGift: boolean
  giftFrom: string | null
}

const EMPTY: PurchaseBook[] = []

/** Libros con su precio y fecha de compra para Bitácora > Compras (fase 6). */
export function usePurchases(userId: string | undefined) {
  const { data: books, isLoading } = useCachedQuery<PurchaseBook[]>(
    ['purchases', userId],
    async () => {
      const { data } = await supabase
        .from('books')
        .select('id, title, author, cover_url, status, price, purchase_date, is_gift, gift_from')
        .eq('user_id', userId!)
      return (data ?? []).map((b) => ({
        id: b.id,
        title: b.title,
        author: b.author,
        coverUrl: b.cover_url,
        status: b.status as ReadingStatus,
        price: b.price,
        purchaseDate: b.purchase_date,
        isGift: b.is_gift ?? false,
        giftFrom: b.gift_from,
      }))
    },
    EMPTY,
    { enabled: !!userId }
  )

  return { books, isLoading }
}
