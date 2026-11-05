/** Celebración de la meta anual cumplida (V.3.6.0): la postal con la estampilla se muestra una
 *  sola vez por año. Se guarda en el dispositivo (sin migración); si la persona usa Teleo en
 *  dos dispositivos puede verla una vez en cada uno, y se acepta. Quien ya había cumplido la
 *  meta antes de la 3.6.0 también la ve una vez (decidido por Fiorella, 4 nov 2026). */

const key = (userId: string, year: number) => `teleo:metaCelebrada:${userId}:${year}`

export function wasGoalCelebrated(userId: string | undefined, year: number): boolean {
  if (!userId) return true
  try {
    return localStorage.getItem(key(userId, year)) !== null
  } catch {
    // Sin almacenamiento (modo privado): mejor no mostrarla que mostrarla cada vez.
    return true
  }
}

export function markGoalCelebrated(userId: string | undefined, year: number) {
  if (!userId) return
  try {
    localStorage.setItem(key(userId, year), new Date().toISOString())
  } catch {
    // Sin almacenamiento: no pasa nada.
  }
}
