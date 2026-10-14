/** Racha más larga de días de lectura seguidos en todo el historial. Misma lógica que la
 *  racha diaria (useReadingStreak), pero contra el arreglo completo de fechas en vez de
 *  contar hacia atrás desde hoy. La usan Bitácora y el calendario de lectura. */
export function computeLongestStreak(dates: string[]): number {
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

export interface StreakRange {
  days: number
  /** Primer y último día de la racha, en `YYYY-MM-DD`. */
  from: string
  to: string
}

/** Lee `YYYY-MM-DD` como fecha local (sin pasar por UTC, que puede correr el día). */
function localDay(value: string): Date {
  const [y, m, d] = value.split('-').map((n) => parseInt(n, 10))
  return new Date(y, m - 1, d)
}

/** Racha más larga con sus fechas de inicio y fin (V.3.2.0, "Tu lectura en Teleo"). Si hay dos
 *  rachas igual de largas, gana la más reciente. null si no hay fechas. */
export function longestStreakRange(dates: string[]): StreakRange | null {
  const sorted = [...new Set(dates)].sort()
  if (sorted.length === 0) return null
  let best: StreakRange = { days: 1, from: sorted[0], to: sorted[0] }
  let start = sorted[0]
  let current = 1
  for (let i = 1; i < sorted.length; i++) {
    const diffDays = Math.round((localDay(sorted[i]).getTime() - localDay(sorted[i - 1]).getTime()) / 86400000)
    if (diffDays === 1) {
      current++
    } else {
      current = 1
      start = sorted[i]
    }
    if (current >= best.days) best = { days: current, from: start, to: sorted[i] }
  }
  return best
}
