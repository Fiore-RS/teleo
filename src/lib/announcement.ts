import { changelog, type ChangelogEntry } from './changelog'

/** Versión que se anuncia con la hoja "Novedades de Teleo" al entrar a La mesa. Cuando haya
 *  otro lanzamiento grande, se cambia esta versión y sus puntos destacados. */
export const ANNOUNCEMENT_VERSION = '4.1.0'

/** true si la hoja de esta versión ofrece "Ver el tutorial" (lo estrenó la 3.3.0). Se apaga
 *  en versiones que no tratan del tutorial; se puede volver a prender si cambia. */
export const ANNOUNCEMENT_OFFERS_TOUR = false

export interface AnnouncementItem {
  title: string
  text: string
}

export const announcementItems: AnnouncementItem[] = [
  { title: 'Tu librero', text: 'En la computadora y la tableta, el Estante es un librero de madera con toda tu biblioteca.' },
  { title: 'Tus sagas', text: 'Con su pila de portadas de siempre, dentro del mismo librero.' },
  { title: 'Filtros a la mano', text: 'Los filtros y la vista se abren a la derecha, y el librero cambia detrás mientras eliges.' },
  { title: 'Todo en su lugar', text: 'Todas las pantallas comparten el fondo de la mesa, los márgenes y el encabezado de La mesa.' },
  { title: 'Poco a poco', text: 'Siguen Cuaderno, Bitácora y Perfil con su diseño para pantallas grandes.' },
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

/** Versiones con anuncio que la persona no vio desde `lastSeen` (de la más nueva a la más
 *  vieja). Si son 2 o más, la hoja de La mesa muestra el aviso de novedades acumuladas. */
export function missedAnnouncedVersions(lastSeen: string | null | undefined): ChangelogEntry[] {
  return changelog.filter((entry) => entry.announced && isVersionBefore(lastSeen, entry.version))
}

/** Desde cuántas versiones con anuncio se muestra el aviso de novedades acumuladas. */
export const CATCH_UP_MIN = 2
