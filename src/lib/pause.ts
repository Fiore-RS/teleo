import { MONTH_NAMES } from './months'
import { todayLocalDate } from './date'
import type { ReadingStatus } from './status'

/** Estado "En pausa" (V.3.1.0). Al pausar se guarda la fecha (paused_at) y un motivo opcional
 *  (pause_reason). Al salir de la pausa, los días en pausa se suman a paused_days y se borran
 *  la fecha y el motivo; así el ritmo y la fecha estimada de fin no cuentan ese tiempo. */

interface PauseFields {
  status: string
  paused_at?: string | null
  paused_days?: number | null
}

const DAY_MS = 24 * 60 * 60 * 1000

/** Días entre dos fechas 'YYYY-MM-DD' (sin pasar por la zona horaria). */
function daysBetween(from: string, to: string): number {
  const [y1, m1, d1] = from.split('-').map((n) => parseInt(n, 10))
  const [y2, m2, d2] = to.split('-').map((n) => parseInt(n, 10))
  return Math.max(0, Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / DAY_MS))
}

/** Columnas de pausa que cambian al pasar de un estado a otro. useBook.updateBook las suma
 *  solas cada vez que cambia el estado (lo que venga explícito en el cambio tiene prioridad,
 *  ej. el motivo al pausar). */
export function pauseTransition(book: PauseFields, newStatus: ReadingStatus, today = todayLocalDate()) {
  if (book.status === newStatus) return {}
  if (newStatus === 'pausado') return { paused_at: today }
  if (book.status === 'pausado') {
    const extra = book.paused_at ? daysBetween(book.paused_at, today) : 0
    return { paused_days: (book.paused_days ?? 0) + extra, paused_at: null, pause_reason: null }
  }
  // Releer un libro terminado: la nueva vuelta empieza sin días en pausa.
  if (book.status === 'terminado' && newStatus === 'leyendo') return { paused_days: 0 }
  return {}
}

/** 'YYYY-MM-DD' → "3 de octubre" (con el año solo si no es el actual). */
export function formatPausedSince(value: string, today = todayLocalDate()): string {
  const [y, m, d] = value.split('-').map((n) => parseInt(n, 10))
  if (!y || !m || !d) return value
  const month = MONTH_NAMES[m - 1].toLowerCase()
  return y === parseInt(today.slice(0, 4), 10) ? `${d} de ${month}` : `${d} de ${month} de ${y}`
}
