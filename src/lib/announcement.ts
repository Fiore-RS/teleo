import { versiones, type ChangelogVersion } from './changelog'

/** Versión que se anuncia con la carta "Novedades de Teleo" al entrar a La mesa (número
 *  interno; en la carta se ve como "Versión 4"). Cuando haya otro lanzamiento grande, se cambia
 *  esta versión y sus puntos destacados. La Versión 4 sale toda junta, así que su carta cuenta
 *  todo lo de escritorio y teléfono. */
export const ANNOUNCEMENT_VERSION = '4.6.0'

/** Título de la carta. Sin esto se usa el de la versión grande (la Versión 4 salió toda junta
 *  con "En cualquier mesa"); la 4.6.0 es una parte con carta propia (Fiorella, 24 nov 2026). */
export const ANNOUNCEMENT_TITLE: string | null = 'Cada lectura a su manera'

/** true si la hoja de esta versión ofrece "Ver el tutorial" (lo estrenó la 3.3.0). Se apaga
 *  en versiones que no tratan del tutorial; se puede volver a prender si cambia. */
export const ANNOUNCEMENT_OFFERS_TOUR = false

export interface AnnouncementItem {
  title: string
  text: string
}

export const announcementItems: AnnouncementItem[] = [
  { title: 'El formato, en cada lectura', text: 'Eliges físico, digital o audiolibro al empezar a leer. Releer en otro formato cuenta como relectura.' },
  { title: 'Páginas y duración', text: 'Al empezar puedes poner o corregir las páginas o la duración del libro.' },
  { title: 'Tu progreso, a tu manera', text: 'Los digitales en páginas o porcentaje, los audiolibros en tiempo o porcentaje.' },
  { title: 'Cada mes con lo suyo', text: 'Las páginas y el tiempo cuentan en el mes en que los leíste, aunque todavía no termines el libro.' },
  { title: 'Tus lecturas anteriores', text: 'En Editar libro ves las fechas y el formato de cada una, y puedes corregirlo.' },
]

/** true si la versión `seen` es anterior a `target` (compara números: 1.10.0 > 1.9.0). */
export function isVersionBefore(seen: string | null | undefined, target: string): boolean {
  if (!seen) return true
  const a = seen.split('.').map(Number)
  const b = target.split('.').map(Number)
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const diff = (a[i] ?? 0) - (b[i] ?? 0)
    if (diff !== 0) return diff < 0
  }
  return false
}

/** Versiones grandes con alguna parte con anuncio que la persona no vio desde `lastSeen` (de la
 *  más nueva a la más vieja). Si son 2 o más, la carta de La mesa muestra el aviso de novedades
 *  acumuladas. Se cuentan versiones grandes, no partes: quien venía de la 3.8.1 y abre la
 *  Versión 4 no ve "¡Cuánto tiempo!" aunque la 4 tenga varias partes. */
export function missedAnnouncedVersions(lastSeen: string | null | undefined): ChangelogVersion[] {
  return versiones.filter((v) => v.entries.some((entry) => entry.announced && isVersionBefore(lastSeen, entry.version)))
}

/** Desde cuántas versiones grandes con anuncio se muestra el aviso de novedades acumuladas. */
export const CATCH_UP_MIN = 2
