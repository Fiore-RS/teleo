import type { Database } from '../types/database'

type Book = Database['public']['Tables']['books']['Row']

type ProgressFields = Pick<Book, 'format' | 'total_duration_seconds' | 'current_duration_seconds' | 'progress_percent' | 'total_pages' | 'current_page'> & {
  progress_unit?: string | null
}

/** Cómo se lleva el progreso de una lectura (V.4.6.0): en páginas, en tiempo escuchado o en
 *  porcentaje. Se recuerda en cada libro (`books.progress_unit`). */
export type ProgressUnit = 'paginas' | 'tiempo' | 'porcentaje'

export const progressUnitLabel: Record<ProgressUnit, string> = {
  paginas: 'Páginas',
  tiempo: 'Tiempo',
  porcentaje: 'Porcentaje',
}

/** Unidades que se pueden elegir según el formato de la lectura: digital en páginas (si el
 *  libro tiene el total) o porcentaje, audiolibro en tiempo o porcentaje, físico en páginas. */
export function progressUnitsFor(book: ProgressFields): ProgressUnit[] {
  if (book.format === 'audiolibro') return ['tiempo', 'porcentaje']
  if (book.format === 'digital') return book.total_pages ? ['paginas', 'porcentaje'] : ['porcentaje']
  return ['paginas']
}

/** La unidad en uso: la última que se eligió en el libro, si sirve para su formato; si no, la
 *  de siempre (físico en páginas, digital en porcentaje, audiolibro en tiempo). */
export function progressUnitOf(book: ProgressFields): ProgressUnit {
  const units = progressUnitsFor(book)
  if (book.progress_unit && units.includes(book.progress_unit as ProgressUnit)) return book.progress_unit as ProgressUnit
  if (book.format === 'audiolibro') return 'tiempo'
  if (book.format === 'digital') return 'porcentaje'
  return 'paginas'
}

export function getProgressInfo(book: ProgressFields): { percent: number; label?: string } {
  const unit = progressUnitOf(book)
  if (unit === 'tiempo') {
    const percent = book.total_duration_seconds ? ((book.current_duration_seconds ?? 0) / book.total_duration_seconds) * 100 : 0
    return { percent, label: formatDuration(book.current_duration_seconds ?? 0) }
  }
  if (unit === 'porcentaje') {
    return { percent: book.progress_percent ?? 0 }
  }
  if (book.total_pages) {
    const percent = ((book.current_page ?? 0) / book.total_pages) * 100
    return { percent, label: `Pág. ${book.current_page ?? 0}` }
  }
  return { percent: 0 }
}

/** Lo que se guarda al actualizar el progreso en una unidad (V.4.6.0): el valor escrito, la
 *  unidad elegida y, si se pueden calcular con el total de páginas o la duración, las otras
 *  dos. Así cambiar de unidad después no pierde el avance. */
export function progressPatch(
  book: ProgressFields,
  unit: ProgressUnit,
  value: number
): Pick<Book, 'progress_unit'> & Partial<Pick<Book, 'current_page' | 'current_duration_seconds' | 'progress_percent'>> {
  const patch: ReturnType<typeof progressPatch> = { progress_unit: unit }
  let percent: number | null = null
  if (unit === 'tiempo') {
    patch.current_duration_seconds = value
    if (book.total_duration_seconds) percent = (value / book.total_duration_seconds) * 100
  } else if (unit === 'porcentaje') {
    percent = value
  } else {
    patch.current_page = value
    if (book.total_pages) percent = (value / book.total_pages) * 100
  }
  if (percent !== null) {
    const clamped = Math.min(100, Math.max(0, percent))
    patch.progress_percent = Math.round(clamped * 100) / 100
    if (unit !== 'paginas' && book.total_pages) patch.current_page = Math.round((clamped / 100) * book.total_pages)
    if (unit !== 'tiempo' && book.total_duration_seconds) {
      patch.current_duration_seconds = Math.round((clamped / 100) * book.total_duration_seconds)
    }
  }
  return patch
}

/** Formatea segundos como hh:mm:ss, siempre con las 3 unidades (para que "tiempo
 *  escuchado" se lea igual en toda la app: stat de Perfil, progreso de audiolibro
 *  en Mesa/DetalleSaga, totales del modal "Libros leídos en 20XX", etc.) */
/** V.4.5.1: "14 h 32 min", "14 h" o "45 min", para el tiempo escuchado en Resumen y el ticket. */
export function formatListenTime(totalSeconds: number): string {
  const totalMinutes = Math.round(Math.max(0, totalSeconds) / 60)
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  if (h === 0) return `${m} min`
  return m === 0 ? `${h} h` : `${h} h ${m} min`
}

export function formatDuration(totalSeconds: number): string {
  const total = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
