import type { UiMarks } from './uiMarks'

/** Anuncio de diciembre de "Tu lectura en Teleo" (V.3.2.0): desde el 1 de diciembre, La mesa
 *  avisa una sola vez por año que el resumen del año está listo para compartir. Desde la
 *  V.3.7.2 se recuerda en la cuenta (ui_marks.anuncioResumen). */

/** true en diciembre si todavía no se vio el anuncio de este año. */
export function isYearRecapAnnouncementDue(marks: UiMarks, now = new Date()): boolean {
  if (now.getMonth() !== 11) return false
  return !marks.anuncioResumen?.[String(now.getFullYear())]
}

export function yearRecapSeenPatch(year: number): UiMarks {
  return { anuncioResumen: { [String(year)]: new Date().toISOString() } }
}
