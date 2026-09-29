import type { Database } from '../types/database'

type Book = Database['public']['Tables']['books']['Row']

type PaceFields = Pick<
  Book,
  'format' | 'start_date' | 'total_pages' | 'current_page' | 'progress_percent' | 'total_duration_seconds' | 'current_duration_seconds'
>

export interface ReadingPace {
  /** Fecha estimada de fin, en hora local. */
  finishDate: Date
  /** Días que faltan (1 = mañana). 0 si a este ritmo se termina hoy. */
  daysLeft: number
  /** Cuánto se avanza por día, ya escrito: "25 pág. por día", "4 % por día", "35 min por día". */
  perDayLabel: string
}

const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const DAY_MS = 24 * 60 * 60 * 1000

/** Días desde la fecha de inicio hasta hoy, contando el día de inicio (empezar hoy = 1). */
function daysSince(startDate: string, today: Date): number {
  const [y, m, d] = startDate.split('-').map((n) => parseInt(n, 10))
  const start = new Date(y, m - 1, d)
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.floor((todayMidnight.getTime() - start.getTime()) / DAY_MS) + 1
}

/** Ritmo de lectura (V.2.1.0): con la fecha de inicio y lo que llevas, cuánto avanzas por día
 *  y cuándo terminarías si sigues igual. null si no hay datos suficientes (sin fecha de
 *  inicio, sin avance, sin total o ya terminado). */
export function getReadingPace(book: PaceFields, today = new Date()): ReadingPace | null {
  if (!book.start_date) return null
  const days = daysSince(book.start_date, today)
  if (days < 1) return null

  let done: number
  let total: number
  let format: (perDay: number) => string
  if (book.format === 'audiolibro') {
    done = book.current_duration_seconds ?? 0
    total = book.total_duration_seconds ?? 0
    format = (perDay) => {
      const min = Math.round(perDay / 60)
      return min >= 60 ? `${(min / 60).toFixed(1).replace('.0', '')} h por día` : `${Math.max(1, min)} min por día`
    }
  } else if (book.format === 'digital') {
    done = book.progress_percent ?? 0
    total = 100
    format = (perDay) => `${Math.max(1, Math.round(perDay))} % por día`
  } else {
    done = book.current_page ?? 0
    total = book.total_pages ?? 0
    format = (perDay) => `${Math.max(1, Math.round(perDay))} pág. por día`
  }

  if (done <= 0 || total <= 0 || done >= total) return null
  const perDay = done / days
  const daysLeft = Math.ceil((total - done) / perDay)
  const finishDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + daysLeft)
  return { finishDate, daysLeft, perDayLabel: format(perDay) }
}

/** "hoy", "mañana", "el 12 oct" o "el 3 ene 2027" (el año solo si no es el actual). */
export function formatFinishDate(date: Date, today = new Date()): string {
  const diff = Math.round(
    (new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() -
      new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) /
      DAY_MS
  )
  if (diff <= 0) return 'hoy'
  if (diff === 1) return 'mañana'
  const base = `el ${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}`
  return date.getFullYear() === today.getFullYear() ? base : `${base} ${date.getFullYear()}`
}

/** Frase corta para mostrar bajo la barra de progreso. */
export function paceSentence(pace: ReadingPace): string {
  return `A este ritmo lo terminas ${formatFinishDate(pace.finishDate)}`
}
