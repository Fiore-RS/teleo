import { versiones, type ChangelogVersion } from './changelog'

/** Versión que se anuncia con la carta "Novedades de Teleo" al entrar a La mesa (número
 *  interno; en la carta se ve como "Versión 4"). Cuando haya otro lanzamiento grande, se cambia
 *  esta versión y sus puntos destacados. La Versión 4 sale toda junta, así que su carta cuenta
 *  todo lo de escritorio y teléfono. */
export const ANNOUNCEMENT_VERSION = '4.5.0'

/** true si la hoja de esta versión ofrece "Ver el tutorial" (lo estrenó la 3.3.0). Se apaga
 *  en versiones que no tratan del tutorial; se puede volver a prender si cambia. */
export const ANNOUNCEMENT_OFFERS_TOUR = false

export interface AnnouncementItem {
  title: string
  text: string
}

export const announcementItems: AnnouncementItem[] = [
  { title: 'Teleo en la computadora', text: 'Ábrela desde el navegador, con cada pantalla pensada para pantallas grandes.' },
  { title: 'Una dirección nueva', text: 'Teleo ahora vive en teleo.fiorers.dev, con todo lo tuyo en tu cuenta.' },
  { title: 'Tu cuaderno, en el teléfono', text: 'Lo que estás leyendo, las hojas y tu Bitácora ahora son hojas de cuaderno.' },
  { title: 'Tu librero', text: 'El Estante y las estanterías del Perfil son un librero de madera.' },
  { title: 'Siempre al día', text: 'Lo que cambias en un dispositivo aparece solo en los demás.' },
  { title: 'Una carta para ti', text: 'Las novedades llegan en una carta, como esta.' },
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
