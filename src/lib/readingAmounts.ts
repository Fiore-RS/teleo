import { readingFormatOf } from './readingHistory'

/* Páginas y tiempo por día (V.4.6.0). Las cifras de un mes o un año suman lo que se avanzó en
 * ese periodo, no el libro entero en el mes en que se terminó (Fiorella, 20 nov 2026).
 *
 * Para cada lectura (terminada o en curso):
 * - Los avances anotados (progress_log) cuentan el día en que se anotaron.
 * - Lo que no quedó anotado (lo leído antes de la V.4.6.0, o un libro agregado ya terminado)
 *   se reparte en partes iguales entre la fecha de inicio y el día antes del primer avance
 *   anotado (o la fecha de fin). Sin fecha de inicio, va al primer avance o a la fecha de fin,
 *   como antes.
 * Las lecturas en audiolibro suman tiempo y las demás, páginas. */

export interface AmountReading {
  book_id: string
  start_date: string | null
  end_date: string
  format: string | null
}

export interface AmountBook {
  id: string
  status: string
  format: string | null
  start_date: string | null
  total_pages: number | null
  total_duration_seconds: number | null
  current_page: number | null
  current_duration_seconds: number | null
}

export interface AmountLog {
  book_id: string
  logged_on: string
  pages: number
  seconds: number
}

export interface DayAmount {
  pages: number
  seconds: number
}

export type DailyAmounts = Map<string, DayAmount>

const DAY_MS = 86400000

function toTime(date: string) {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, m - 1, d).getTime()
}

function toDate(time: number) {
  const d = new Date(time)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function add(daily: DailyAmounts, date: string, isAudio: boolean, amount: number) {
  if (!amount) return
  const day = daily.get(date) ?? { pages: 0, seconds: 0 }
  if (isAudio) day.seconds += amount
  else day.pages += amount
  daily.set(date, day)
}

/** Reparte `amount` en partes iguales entre `from` y `to` (los dos incluidos). */
function spread(daily: DailyAmounts, from: string, to: string, isAudio: boolean, amount: number) {
  if (amount <= 0) return
  const start = toTime(from)
  const end = Math.max(start, toTime(to))
  const days = Math.round((end - start) / DAY_MS) + 1
  for (let i = 0; i < days; i++) add(daily, toDate(start + i * DAY_MS), isAudio, amount / days)
}

/** Una lectura: total que se leyó, su ventana de avances y sus fechas. */
function addReading(
  daily: DailyAmounts,
  logs: AmountLog[],
  isAudio: boolean,
  total: number,
  window: { after: string | null; until: string },
  startDate: string | null
) {
  const own = logs
    .filter((l) => (!window.after || l.logged_on > window.after) && l.logged_on <= window.until)
    .sort((a, b) => a.logged_on.localeCompare(b.logged_on))
  let covered = 0
  for (const l of own) {
    const amount = isAudio ? l.seconds : l.pages
    covered += amount
    add(daily, l.logged_on, isAudio, amount)
  }
  const uncovered = total - covered
  if (uncovered <= 0) return
  const firstLog = own[0]?.logged_on
  const spreadEnd = firstLog ? toDate(Math.max(toTime(firstLog) - DAY_MS, startDate ? toTime(startDate) : -Infinity)) : window.until
  if (startDate && startDate <= spreadEnd) spread(daily, startDate, spreadEnd, isAudio, uncovered)
  else add(daily, firstLog ?? window.until, isAudio, uncovered)
}

/** Páginas y segundos por día de todas las lecturas (terminadas y en curso). */
export function dailyAmounts(readings: AmountReading[], books: AmountBook[], logs: AmountLog[], today: string): DailyAmounts {
  const daily: DailyAmounts = new Map()
  const bookById = new Map(books.map((b) => [b.id, b]))
  const logsByBook = new Map<string, AmountLog[]>()
  for (const l of logs) (logsByBook.get(l.book_id) ?? logsByBook.set(l.book_id, []).get(l.book_id)!).push(l)

  // Lecturas terminadas de cada libro, en orden: los avances de una van desde el fin de la
  // anterior hasta su propio fin.
  const readsByBook = new Map<string, AmountReading[]>()
  for (const r of readings) (readsByBook.get(r.book_id) ?? readsByBook.set(r.book_id, []).get(r.book_id)!).push(r)

  for (const [bookId, reads] of readsByBook) {
    const book = bookById.get(bookId)
    if (!book) continue
    const bookLogs = logsByBook.get(bookId) ?? []
    reads.sort((a, b) => a.end_date.localeCompare(b.end_date))
    reads.forEach((r, i) => {
      const isAudio = readingFormatOf(r.format, book.format) === 'audiolibro'
      const total = (isAudio ? book.total_duration_seconds : book.total_pages) ?? 0
      addReading(daily, bookLogs, isAudio, total, { after: reads[i - 1]?.end_date ?? null, until: r.end_date }, r.start_date)
    })
  }

  // Lecturas en curso: lo que se lleva hasta hoy.
  for (const book of books) {
    if (book.status !== 'leyendo' && book.status !== 'pausado') continue
    const isAudio = book.format === 'audiolibro'
    const total = (isAudio ? book.current_duration_seconds : book.current_page) ?? 0
    const reads = readsByBook.get(book.id)
    const after = reads && reads.length > 0 ? reads[reads.length - 1].end_date : null
    addReading(daily, logsByBook.get(book.id) ?? [], isAudio, total, { after, until: today }, book.start_date)
  }

  return daily
}

/** Suma de páginas y segundos entre dos fechas (las dos incluidas). */
export function amountsBetween(daily: DailyAmounts, from: string, to: string): DayAmount {
  let pages = 0
  let seconds = 0
  for (const [date, day] of daily) {
    if (date < from || date > to) continue
    pages += day.pages
    seconds += day.seconds
  }
  return { pages: Math.round(pages), seconds: Math.round(seconds) }
}
