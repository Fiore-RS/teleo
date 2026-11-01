import { supabase } from '../lib/supabase'
import type { Database } from '../types/database'
import { useCachedQuery } from './useCachedQuery'

type Book = Database['public']['Tables']['books']['Row']
/** Lo mínimo para mostrar una portada en los estantes del perfil. */
type ShelfBook = Pick<Book, 'id' | 'title' | 'cover_url' | 'status'>

export interface ProfileCounts {
  finished: number
  pending: number
  wishlist: number
  abandoned: number
  /** En pausa (V.3.1.0). */
  paused: number
}

/** Último libro terminado, para "Ahora mismo" (V.3.5.0). */
export type LastFinishedBook = Pick<Book, 'id' | 'title' | 'cover_url' | 'status' | 'author'> & { rating: number | null }

/** Una cita para "Ahora mismo" (V.3.5.0), con el libro de su reseña. */
export interface ProfileQuote {
  id: string
  text: string
  page: number | null
  bookId: string | null
  bookTitle: string | null
}

interface ProfileLists {
  currentlyReading: Book[]
  lastFinished: LastFinishedBook | null
  /** Las citas más recientes; Perfil muestra una al azar en cada visita. */
  quotes: ProfileQuote[]
  /** Listas completas: Perfil muestra 4 al azar de cada una en cada visita. */
  favorites: ShelfBook[]
  recommended: ShelfBook[]
  wishlist: ShelfBook[]
  abandoned: ShelfBook[]
  counts: ProfileCounts
}

const EMPTY: ProfileLists = {
  currentlyReading: [],
  lastFinished: null,
  quotes: [],
  favorites: [],
  recommended: [],
  wishlist: [],
  abandoned: [],
  counts: { finished: 0, pending: 0, wishlist: 0, abandoned: 0, paused: 0 },
}

const SHELF_COLUMNS = 'id, title, cover_url, status'

// Solo el conteo (sin traer filas) para la fila de números de Perfil.
function countByStatus(userId: string, status: string) {
  return supabase.from('books').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', status)
}

export function useProfileLists(userId: string | undefined) {
  const { data, isLoading, refetch } = useCachedQuery<ProfileLists>(
    ['profileLists', userId],
    async () => {
      const [
        { data: reading },
        { data: favs },
        { data: rec },
        { data: wish },
        { data: aband },
        { count: finishedCount },
        { count: pendingCount },
        { count: wishlistCount },
        { count: abandonedCount },
        { count: pausedCount },
        { data: lastRows },
        { data: quoteRows },
      ] = await Promise.all([
        supabase.from('books').select('*').eq('user_id', userId!).eq('status', 'leyendo').limit(6),
        supabase.from('books').select(SHELF_COLUMNS).eq('user_id', userId!).eq('is_favorite', true),
        supabase.from('books').select(SHELF_COLUMNS).eq('user_id', userId!).eq('is_recommended', true),
        supabase.from('books').select(SHELF_COLUMNS).eq('user_id', userId!).eq('status', 'deseado'),
        supabase.from('books').select(SHELF_COLUMNS).eq('user_id', userId!).eq('status', 'abandonado'),
        countByStatus(userId!, 'terminado'),
        countByStatus(userId!, 'pendiente'),
        countByStatus(userId!, 'deseado'),
        countByStatus(userId!, 'abandonado'),
        countByStatus(userId!, 'pausado'),
        supabase
          .from('books')
          .select('id, title, cover_url, status, author, reviews(general_rating)')
          .eq('user_id', userId!)
          .eq('status', 'terminado')
          .not('end_date', 'is', null)
          .order('end_date', { ascending: false })
          .limit(1),
        supabase
          .from('favorite_quotes')
          .select('id, quote_text, page, reviews!inner(user_id, book_id, books(title))')
          .eq('reviews.user_id', userId!)
          .order('created_at', { ascending: false })
          .limit(40),
      ])
      type LastRow = Pick<Book, 'id' | 'title' | 'cover_url' | 'status' | 'author'> & { reviews: { general_rating: number | null }[] | null }
      type QuoteRow = { id: string; quote_text: string; page: number | null; reviews: { book_id: string; books: { title: string } | null } | null }
      const last = ((lastRows ?? []) as unknown as LastRow[])[0]
      const quotes = ((quoteRows ?? []) as unknown as QuoteRow[]).map((q) => ({
        id: q.id,
        text: q.quote_text,
        page: q.page,
        bookId: q.reviews?.book_id ?? null,
        bookTitle: q.reviews?.books?.title ?? null,
      }))
      return {
        currentlyReading: reading ?? [],
        lastFinished: last
          ? { id: last.id, title: last.title, cover_url: last.cover_url, status: last.status, author: last.author, rating: last.reviews?.[0]?.general_rating ?? null }
          : null,
        quotes,
        favorites: favs ?? [],
        recommended: rec ?? [],
        wishlist: wish ?? [],
        abandoned: aband ?? [],
        counts: {
          finished: finishedCount ?? 0,
          pending: pendingCount ?? 0,
          wishlist: wishlistCount ?? 0,
          abandoned: abandonedCount ?? 0,
          paused: pausedCount ?? 0,
        },
      }
    },
    EMPTY,
    { enabled: !!userId }
  )

  return { ...data, isLoading, refetch }
}
