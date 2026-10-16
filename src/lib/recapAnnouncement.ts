/** Anuncio de diciembre de "Tu lectura en Teleo" (V.3.2.0): desde el 1 de diciembre, La mesa
 *  avisa una sola vez que el resumen del año está listo para compartir. Se recuerda en el
 *  dispositivo (sin migración), por cuenta y por año. */

const key = (userId: string, year: number) => `teleo-anuncio-resumen-${userId}-${year}`

/** true en diciembre si todavía no se vio el anuncio de este año en este dispositivo. */
export function isYearRecapAnnouncementDue(userId: string | undefined, now = new Date()): boolean {
  if (!userId || now.getMonth() !== 11) return false
  try {
    return localStorage.getItem(key(userId, now.getFullYear())) === null
  } catch {
    return false
  }
}

export function markYearRecapAnnouncementSeen(userId: string | undefined, year: number) {
  if (!userId) return
  try {
    localStorage.setItem(key(userId, year), new Date().toISOString())
  } catch {
    // Sin almacenamiento (modo privado): el anuncio puede volver a salir, no pasa nada.
  }
}
