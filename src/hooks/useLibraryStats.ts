import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export interface CountEntry {
  label: string
  count: number
}

export interface BookRef {
  title: string
  value: number // páginas, calificación o precio, según la sección
}

export interface LibraryStats {
  resumen: {
    pagesRead: number
    audioSeconds: number
    finishedCount: number
    readingCount: number
    wishlistCount: number
    abandonedCount: number
    sagaCount: number
    reviewCount: number
    memberSince: string | null
  }
  ritmo: {
    longestStreak: number
    sessionDates: string[]
  }
  coleccion: {
    byCategory: CountEntry[]
    byFormat: CountEntry[]
    byLanguage: CountEntry[]
    longestBook: BookRef | null
    shortestBook: BookRef | null
  }
  autoresYSeries: {
    topAuthor: CountEntry | null
    sagasCompleted: number
    sagasInProgress: number
    mostRereadBook: CountEntry | null
  }
  calificaciones: {
    avgRating: number | null
    bestRated: BookRef | null
    worstRated: BookRef | null
    /** true si hubo empate en la calificación más alta o más baja — bestRated/worstRated
     *  salió elegido al azar entre los empatados, así que puede cambiar en cada visita. */
    hasTie: boolean
    quotesCount: number
  }
  historialAnual: {
    yearsBreakdown: { year: number; count: number }[]
    monthlyThisYear: { month: number; count: number }[]
    currentYearCount: number
    previousYearCount: number
  }
  valorBiblioteca: {
    totalInvested: number
    booksWithPriceCount: number
    avgPerBook: number
    mostExpensive: BookRef | null
    wishlistCost: number
    wishlistWithPriceCount: number
  }
}

const emptyStats: LibraryStats = {
  resumen: { pagesRead: 0, audioSeconds: 0, finishedCount: 0, readingCount: 0, wishlistCount: 0, abandonedCount: 0, sagaCount: 0, reviewCount: 0, memberSince: null },
  ritmo: { longestStreak: 0, sessionDates: [] },
  coleccion: { byCategory: [], byFormat: [], byLanguage: [], longestBook: null, shortestBook: null },
  autoresYSeries: { topAuthor: null, sagasCompleted: 0, sagasInProgress: 0, mostRereadBook: null },
  calificaciones: { avgRating: null, bestRated: null, worstRated: null, hasTie: false, quotesCount: 0 },
  historialAnual: { yearsBreakdown: [], monthlyThisYear: [], currentYearCount: 0, previousYearCount: 0 },
  valorBiblioteca: { totalInvested: 0, booksWithPriceCount: 0, avgPerBook: 0, mostExpensive: null, wishlistCost: 0, wishlistWithPriceCount: 0 },
}

/** Misma lógica que la racha diaria (useReadingStreak), pero contra un arreglo completo de
 *  fechas en vez de recalcular contra "hoy" — sirve para "racha más extensa" histórica. */
function computeLongestStreak(dates: string[]): number {
  const sorted = [...new Set(dates)].sort()
  let longest = 0
  let current = 0
  let prevDate: Date | null = null

  for (const d of sorted) {
    const date = new Date(d)
    if (prevDate) {
      const diffDays = Math.round((date.getTime() - prevDate.getTime()) / 86400000)
      current = diffDays === 1 ? current + 1 : 1
    } else {
      current = 1
    }
    longest = Math.max(longest, current)
    prevDate = date
  }
  return longest
}

function tally(values: (string | null)[]): CountEntry[] {
  const counts = new Map<string, number>()
  for (const v of values) {
    if (!v) continue
    counts.set(v, (counts.get(v) ?? 0) + 1)
  }
  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
}

/** Trae y calcula todas las estadísticas de Bitácora en un solo lugar, a partir de datos
 *  que ya se guardan hoy (books, sagas, reviews, reading_history, reading_sessions,
 *  favorite_quotes) más los campos nuevos `books.price`/`books.purchase_date` de la
 *  sección "Valor de tu biblioteca". Reemplaza a `useProfileStats` (que se queda sin uso
 *  una vez que Perfil deja de mostrar Estadísticas/Racha/Años en libros). */
export function useLibraryStats(userId: string | undefined) {
  const [stats, setStats] = useState<LibraryStats>(emptyStats)
  const [isLoading, setIsLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!userId) return
    setIsLoading(true)

    const [
      { data: booksData },
      { data: sagasData },
      { data: reviewsData },
      { data: historyData },
      { data: sessionsData },
    ] = await Promise.all([
      supabase.from('books')
        .select('id, title, author, status, category, format, language, total_pages, total_duration_seconds, saga_id, price, purchase_date, created_at')
        .eq('user_id', userId),
      supabase.from('sagas').select('id, status').eq('user_id', userId),
      supabase.from('reviews').select('id, book_id, general_rating').eq('user_id', userId),
      supabase.from('reading_history').select('book_id, end_date').eq('user_id', userId),
      supabase.from('reading_sessions').select('session_date').eq('user_id', userId),
    ])

    const books = booksData ?? []
    const sagas = sagasData ?? []
    const reviews = reviewsData ?? []
    const reads = historyData ?? []
    const sessions = sessionsData ?? []

    const bookById = new Map(books.map((b) => [b.id, b]))
    const finished = books.filter((b) => b.status === 'terminado')
    const reading = books.filter((b) => b.status === 'leyendo')
    const wishlist = books.filter((b) => b.status === 'deseado')
    const abandoned = books.filter((b) => b.status === 'abandonado')

    let quotesCount = 0
    if (reviews.length > 0) {
      const { count } = await supabase
        .from('favorite_quotes')
        .select('*', { count: 'exact', head: true })
        .in('review_id', reviews.map((r) => r.id))
      quotesCount = count ?? 0
    }

    // Resumen general — "leyendo Teleo desde" toma el libro más antiguo agregado. Páginas
    // leídas y tiempo escuchado se recuperan (2026-08-30, pedido de Fiorella): se suman por
    // CADA lectura completada en reading_history (una relectura vuelve a sumar), igual que
    // hacía useProfileStats antes de que Bitácora lo reemplazara.
    const oldestCreatedAt = books.reduce<string | null>((oldest, b) => {
      if (!b.created_at) return oldest
      return !oldest || b.created_at < oldest ? b.created_at : oldest
    }, null)
    const pagesRead = reads.reduce((sum, h) => sum + (bookById.get(h.book_id)?.total_pages ?? 0), 0)
    const audioSeconds = reads
      .filter((h) => bookById.get(h.book_id)?.format === 'audiolibro')
      .reduce((sum, h) => sum + (bookById.get(h.book_id)?.total_duration_seconds ?? 0), 0)

    // Ritmo y hábito — 2026-08-30: se dejó esta sección enfocada solo en racha + heatmap
    // (feedback de Fiorella). "Promedio pág./día" y su reemplazo "Libros por mes" se
    // probaron y se quitaron: el primero daba números absurdos (páginas de toda la vida ÷
    // días de racha marcados, dos cosas sin relación), y una vez corregido igual se decidió
    // que la sección se sintiera más simple con solo racha diaria + calendario de lectura.
    const longestStreak = computeLongestStreak(sessions.map((s) => s.session_date))

    // Desglose de colección
    const byCategory = tally(books.map((b) => b.category))
    const byFormat = tally(books.map((b) => b.format))
    const byLanguage = tally(books.map((b) => b.language))
    const booksWithPages = books.filter((b) => typeof b.total_pages === 'number' && b.total_pages! > 0)
    const longestBook = booksWithPages.length > 0
      ? booksWithPages.reduce((max, b) => (b.total_pages! > max.total_pages! ? b : max))
      : null
    const shortestBook = booksWithPages.length > 0
      ? booksWithPages.reduce((min, b) => (b.total_pages! < min.total_pages! ? b : min))
      : null

    // Autores y series
    const authorCounts = tally(books.filter((b) => b.status !== 'deseado').map((b) => b.author))
    const sagasCompleted = sagas.filter((s) => s.status === 'terminado').length
    const sagasInProgress = sagas.filter((s) => s.status === 'leyendo').length
    const rereadCounts = new Map<string, number>()
    for (const r of reads) {
      rereadCounts.set(r.book_id, (rereadCounts.get(r.book_id) ?? 0) + 1)
    }
    let mostRereadBook: CountEntry | null = null
    for (const [bookId, count] of rereadCounts.entries()) {
      if (count > 1 && (!mostRereadBook || count > mostRereadBook.count)) {
        const title = bookById.get(bookId)?.title
        if (title) mostRereadBook = { label: title, count }
      }
    }

    // Calificaciones
    const ratedReviews = reviews.filter((r) => typeof r.general_rating === 'number')
    const avgRating = ratedReviews.length > 0
      ? ratedReviews.reduce((sum, r) => sum + (r.general_rating ?? 0), 0) / ratedReviews.length
      : null

    const ratedBooks = ratedReviews
      .map((r) => ({ title: bookById.get(r.book_id)?.title, value: r.general_rating! }))
      .filter((r): r is BookRef => Boolean(r.title))

    // Mejor/peor calificado: cuando varios libros empatan en la calificación más alta (o
    // más baja), antes siempre se mostraba el primero que apareciera en la consulta —
    // Fiorella pidió que en un empate se elija uno al azar entre los empatados en cada
    // visita a Bitácora, en vez de quedarse pegado siempre en el mismo.
    let bestRated: BookRef | null = null
    let worstRated: BookRef | null = null
    let hasTie = false
    if (ratedBooks.length > 0) {
      const maxRating = Math.max(...ratedBooks.map((b) => b.value))
      const minRating = Math.min(...ratedBooks.map((b) => b.value))
      const bestCandidates = ratedBooks.filter((b) => b.value === maxRating)
      const worstCandidates = ratedBooks.filter((b) => b.value === minRating)
      bestRated = bestCandidates[Math.floor(Math.random() * bestCandidates.length)]
      worstRated = worstCandidates[Math.floor(Math.random() * worstCandidates.length)]
      hasTie = bestCandidates.length > 1 || worstCandidates.length > 1
    }

    // Historial anual — igual que useProfileStats (por reading_history, no por end_date de
    // books directamente), más el recap mensual del año en curso para la gráfica de barras.
    const currentYear = new Date().getFullYear()
    const yearCounts = new Map<number, number>()
    const monthCounts = new Map<number, number>()
    reads.forEach((h) => {
      const year = parseInt(h.end_date.slice(0, 4), 10)
      yearCounts.set(year, (yearCounts.get(year) ?? 0) + 1)
      if (year === currentYear) {
        const month = parseInt(h.end_date.slice(5, 7), 10)
        monthCounts.set(month, (monthCounts.get(month) ?? 0) + 1)
      }
    })
    const yearsBreakdown = Array.from(yearCounts.entries())
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => b.year - a.year)
    const monthlyThisYear = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, count: monthCounts.get(i + 1) ?? 0 }))

    // Valor de la biblioteca — se excluye siempre de get_public_profile_extras (ver
    // 0020_library_value.sql), esto solo se usa en la vista privada de Bitácora.
    const booksWithPrice = books.filter((b) => typeof b.price === 'number')
    const totalInvested = booksWithPrice.reduce((sum, b) => sum + (b.price ?? 0), 0)
    const avgPerBook = booksWithPrice.length > 0 ? totalInvested / booksWithPrice.length : 0
    const mostExpensive = booksWithPrice.length > 0
      ? booksWithPrice.reduce((max, b) => ((b.price ?? 0) > (max.price ?? 0) ? b : max))
      : null
    const wishlistWithPrice = wishlist.filter((b) => typeof b.price === 'number')
    const wishlistCost = wishlistWithPrice.reduce((sum, b) => sum + (b.price ?? 0), 0)

    setStats({
      resumen: {
        pagesRead,
        audioSeconds,
        finishedCount: finished.length,
        readingCount: reading.length,
        wishlistCount: wishlist.length,
        abandonedCount: abandoned.length,
        sagaCount: sagas.length,
        reviewCount: reviews.length,
        memberSince: oldestCreatedAt,
      },
      ritmo: {
        longestStreak,
        sessionDates: sessions.map((s) => s.session_date),
      },
      coleccion: {
        byCategory,
        byFormat,
        byLanguage,
        longestBook: longestBook ? { title: longestBook.title, value: longestBook.total_pages ?? 0 } : null,
        shortestBook: shortestBook ? { title: shortestBook.title, value: shortestBook.total_pages ?? 0 } : null,
      },
      autoresYSeries: {
        topAuthor: authorCounts[0] ?? null,
        sagasCompleted,
        sagasInProgress,
        mostRereadBook,
      },
      calificaciones: { avgRating, bestRated, worstRated, hasTie, quotesCount },
      historialAnual: {
        yearsBreakdown,
        monthlyThisYear,
        currentYearCount: yearCounts.get(currentYear) ?? 0,
        previousYearCount: yearCounts.get(currentYear - 1) ?? 0,
      },
      valorBiblioteca: {
        totalInvested,
        booksWithPriceCount: booksWithPrice.length,
        avgPerBook,
        mostExpensive: mostExpensive ? { title: mostExpensive.title, value: mostExpensive.price ?? 0 } : null,
        wishlistCost,
        wishlistWithPriceCount: wishlistWithPrice.length,
      },
    })
    setIsLoading(false)
  }, [userId])

  useEffect(() => { refetch() }, [refetch])

  return { stats, isLoading, refetch }
}
