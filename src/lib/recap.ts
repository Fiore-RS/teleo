import type { YearRead } from '../hooks/useYearReads'
import { computeTraitStats, MIN_BOOKS_FOR_TRAIT_STATS, type TraitStats } from './traitStats'
import { tally, type CountEntry } from './tally'
import { longestStreakRange, type StreakRange } from './streak'

/** "Tu lectura en Teleo" (V.3.2.0): los datos del resumen de un mes o un año y qué tarjetas
 *  entran. Todo es puro (sin Supabase) para que se pueda probar y reusar: el hook useRecap
 *  junta los datos y llama a buildRecap. */

export type RecapPeriod = { kind: 'anio'; year: number } | { kind: 'mes'; year: number; month: number }

export type RecapCardId =
  | 'portada'
  | 'libros'
  | 'meses'
  | 'generos'
  | 'autor'
  | 'racha'
  | 'relecturas'
  | 'favorito'
  | 'cierre'

/** Reglas para que una tarjeta entre (acordadas con Fiorella, 13 oct 2026). */
export const RECAP_RULES = {
  /** Mes más lector: al menos 3 meses con libros terminados. */
  minMonthsWithReads: 3,
  /** Géneros y ánimos: libros con el dato. En el año, igual que Estadísticas; en el mes, 3. */
  minTraitBooks: { anio: MIN_BOOKS_FOR_TRAIT_STATS, mes: 3 },
  /** Autor más leído: un autor con al menos 2 libros. */
  minAuthorBooks: 2,
  /** Racha más larga: al menos 3 días seguidos. */
  minStreakDays: 3,
} as const

/** Grosor aproximado de una hoja: 0,1 mm por página, para "Apiladas, medirían...". */
const MM_PER_PAGE = 0.1

export interface RecapBook {
  bookId: string
  title: string
  author: string | null
  coverUrl: string | null
  /** Fecha en que se terminó (la primera vez dentro del periodo). `YYYY-MM-DD`. */
  endDate: string
}

export interface RecapReread extends RecapBook {
  /** Qué vez lo terminaste: 2 = segunda lectura. */
  time: number
}

export interface RecapData {
  period: RecapPeriod
  /** El periodo todavía no termina ("Hasta ahora" / "Hasta hoy"). */
  isOngoing: boolean
  /** Primer día del periodo y último día que cuenta (hoy, si está en curso). `YYYY-MM-DD`. */
  start: string
  end: string
  /** Días del periodo hasta `end`. */
  elapsedDays: number
  /** Lecturas terminadas (una relectura cuenta otra vez, como en Resumen). */
  readCount: number
  /** Libros sin repetir, en el orden en que se terminaron. */
  books: RecapBook[]
  pages: number
  /** Centímetros de las páginas apiladas. */
  stackCm: number
  /** Solo en el año: páginas por día, redondeado. */
  pagesPerDay: number | null
  /** Fechas del periodo con sesión de lectura marcada (`YYYY-MM-DD`, ordenadas). */
  readDays: string[]
  /** Solo en el año: libros por mes (índice 0 = enero); null en los meses que todavía no llegan. */
  months: (number | null)[] | null
  bestMonth: { month: number; count: number; tiedWith: number[] } | null
  traits: TraitStats
  topGenres: CountEntry[]
  topMoods: CountEntry[]
  topPace: string | null
  /** Cuántos libros tienen algún rasgo (el mayor entre género, ánimo y ritmo). */
  traitBooks: number
  author: { name: string; count: number; books: RecapBook[] } | null
  streak: StreakRange | null
  rereads: RecapReread[]
  favorite: RecapBook | null
  /** Tarjetas que entran, en orden. */
  cards: RecapCardId[]
}

export interface BuildRecapInput {
  period: RecapPeriod
  /** Lecturas del periodo (reading_history), ordenadas por fecha de fin. */
  reads: YearRead[]
  /** Todas las fechas con sesión de lectura (`reading_sessions`). */
  sessionDates: string[]
  /** Cuántas veces se terminó cada libro ANTES del periodo, para saber qué es relectura. */
  priorCompletions: Map<string, number>
  /** Libro favorito del periodo (Resumen › Favoritos), o null. */
  favoriteBookId: string | null
  /** Hoy en `YYYY-MM-DD` (se pasa para poder probar con cualquier fecha). */
  today: string
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

/** Primer y último día del periodo. */
export function periodBounds(period: RecapPeriod): { start: string; last: string } {
  if (period.kind === 'anio') return { start: `${period.year}-01-01`, last: `${period.year}-12-31` }
  const lastDay = new Date(period.year, period.month, 0).getDate()
  return { start: `${period.year}-${pad(period.month)}-01`, last: `${period.year}-${pad(period.month)}-${pad(lastDay)}` }
}

function daysBetween(from: string, to: string) {
  const [y1, m1, d1] = from.split('-').map(Number)
  const [y2, m2, d2] = to.split('-').map(Number)
  return Math.round((new Date(y2, m2 - 1, d2).getTime() - new Date(y1, m1 - 1, d1).getTime()) / 86400000) + 1
}

const toBook = (r: YearRead): RecapBook => ({ bookId: r.bookId, title: r.title, author: r.author, coverUrl: r.coverUrl, endDate: r.endDate })

export function buildRecap({ period, reads, sessionDates, priorCompletions, favoriteBookId, today }: BuildRecapInput): RecapData {
  const { start, last } = periodBounds(period)
  const isOngoing = today >= start && today <= last
  const end = isOngoing ? today : last
  const elapsedDays = Math.max(1, daysBetween(start, end))

  // Libros sin repetir, en orden de fin.
  const byId = new Map<string, RecapBook>()
  for (const r of reads) if (!byId.has(r.bookId)) byId.set(r.bookId, toBook(r))
  const books = [...byId.values()]

  // Como en Resumen: una relectura suma sus páginas otra vez.
  const pages = reads.reduce((sum, r) => sum + r.pages, 0)

  // Mes más lector (solo en el año).
  let months: (number | null)[] | null = null
  let bestMonth: RecapData['bestMonth'] = null
  if (period.kind === 'anio') {
    const lastMonth = isOngoing ? parseInt(today.slice(5, 7), 10) : 12
    const counts = Array.from({ length: 12 }, () => 0)
    for (const r of reads) counts[r.month - 1] += 1
    months = counts.map((c, i) => (i + 1 > lastMonth ? null : c))
    const withReads = counts.filter((c) => c > 0).length
    if (withReads >= RECAP_RULES.minMonthsWithReads) {
      const max = Math.max(...counts)
      const tied = counts.map((c, i) => (c === max ? i + 1 : 0)).filter(Boolean)
      // Con empate, el más reciente; los demás quedan en tiedWith para el texto.
      const month = tied[tied.length - 1]
      bestMonth = { month, count: max, tiedWith: tied.filter((m) => m !== month) }
    }
  }

  // Géneros, ánimos y ritmo: cada libro una vez.
  const traits = computeTraitStats(reads.map((r) => ({ ...r, id: r.bookId })))
  const traitBooks = Math.max(traits.withGenre, traits.withMood, traits.withPace)

  // Autor más leído: con empate, el que terminaste más recientemente.
  let author: RecapData['author'] = null
  const authorCounts = tally(books.map((b) => b.author?.trim()))
  const top = authorCounts[0]
  if (top && top.count >= RECAP_RULES.minAuthorBooks) {
    const tiedNames = new Set(authorCounts.filter((a) => a.count === top.count).map((a) => a.label))
    const lastOfTied = [...books].reverse().find((b) => b.author && tiedNames.has(b.author.trim()))
    const name = lastOfTied?.author?.trim() ?? top.label
    author = { name, count: top.count, books: books.filter((b) => b.author?.trim() === name) }
  }

  // Sesiones del periodo y racha más larga dentro de él.
  const periodSessions = [...new Set(sessionDates)].filter((d) => d >= start && d <= end).sort()
  const streakRange = longestStreakRange(periodSessions)
  const streak = streakRange && streakRange.days >= RECAP_RULES.minStreakDays ? streakRange : null

  // Relecturas: se cuentan las veces anteriores al periodo y las de dentro.
  const seen = new Map(priorCompletions)
  const rereads: RecapReread[] = []
  for (const r of reads) {
    const time = (seen.get(r.bookId) ?? 0) + 1
    seen.set(r.bookId, time)
    if (time >= 2) rereads.push({ ...toBook(r), time })
  }

  const favorite = favoriteBookId ? byId.get(favoriteBookId) ?? null : null

  const minTraits = RECAP_RULES.minTraitBooks[period.kind]
  const cards: RecapCardId[] = ['portada', 'libros']
  if (bestMonth) cards.push('meses')
  if (traitBooks >= minTraits) cards.push('generos')
  if (period.kind === 'anio') {
    if (author) cards.push('autor')
    if (streak) cards.push('racha')
    if (rereads.length > 0) cards.push('relecturas')
  }
  if (favorite) cards.push('favorito')
  cards.push('cierre')

  return {
    period,
    isOngoing,
    start,
    end,
    elapsedDays,
    readCount: reads.length,
    books,
    pages,
    stackCm: Math.round((pages * MM_PER_PAGE) / 10),
    pagesPerDay: period.kind === 'anio' && pages > 0 ? Math.round(pages / elapsedDays) : null,
    readDays: periodSessions,
    months,
    bestMonth,
    traits,
    topGenres: traits.genres.slice(0, 3),
    topMoods: traits.moods.slice(0, 3),
    topPace: traits.paces[0]?.label ?? null,
    traitBooks,
    author,
    streak,
    rereads,
    favorite,
    cards,
  }
}

/** "casi 1,4 metros" / "unos 12 centímetros", para la pila de páginas. */
export function formatStackHeight(cm: number): string {
  if (cm >= 100) return `casi ${(cm / 100).toLocaleString('es', { maximumFractionDigits: 1 })} metros`
  return `unos ${Math.max(1, cm)} ${cm === 1 ? 'centímetro' : 'centímetros'}`
}

/** Hay resumen para compartir si se terminó al menos un libro en el periodo. */
export function hasRecap(readCount: number) {
  return readCount > 0
}
