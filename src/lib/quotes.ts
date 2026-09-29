/** Utilidades de Mis citas (V.2.1.0). */

/** Convierte lo escrito en "Pág." a número: vacío o inválido = sin página. */
export function parsePage(value: string): number | null {
  const n = Number.parseInt(value, 10)
  return Number.isFinite(n) && n > 0 ? n : null
}

/** Solo dígitos, hasta 5 (para el campo "Pág."). */
export function cleanPageInput(value: string): string {
  return value.replace(/\D/g, '').slice(0, 5)
}

/** Quita acentos y pasa a minúsculas, para buscar "corazon" y encontrar "corazón". */
export function normalizeForSearch(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}
