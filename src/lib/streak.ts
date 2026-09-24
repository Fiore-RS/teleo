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
