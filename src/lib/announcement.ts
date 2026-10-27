import { changelog, type ChangelogEntry } from './changelog'

/** Versión que se anuncia con la hoja "Novedades de Teleo" al entrar a La mesa. Cuando haya
 *  otro lanzamiento grande, se cambia esta versión y sus puntos destacados. */
export const ANNOUNCEMENT_VERSION = '3.3.0'

export interface AnnouncementItem {
  title: string
  text: string
}

export const announcementItems: AnnouncementItem[] = [
  { title: 'Invita a alguien', text: 'Desde Perfil › Compartir: un enlace con un mensaje listo o una tarjeta con tu foto y un código QR.' },
  { title: 'Tu código de Teleo', text: 'Cada cuenta tiene el suyo. Lo ves en Perfil › Compartir y en Configuración; tócalo para copiarlo.' },
  { title: 'Un tutorial nuevo', text: 'Un recorrido corto sobre la misma app. La explicación detallada ahora se llama Guía de Teleo.' },
  { title: 'Mis próximas lecturas', text: 'Tu lista de la temporada cambia de nombre, y con "Agregar libros" eliges qué pendientes entran.' },
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
