import { Library, Sparkles, UserCog, type LucideIcon } from 'lucide-react'
import { changelog, type ChangelogEntry } from './changelog'

/** Versión que se anuncia con la hoja "Novedades de Teleo" al entrar a La mesa. Cuando haya
 *  otro lanzamiento grande, se cambia esta versión y sus puntos destacados. */
export const ANNOUNCEMENT_VERSION = '2.2.0'

export interface AnnouncementItem {
  icon: LucideIcon
  title: string
  text: string
}

export const announcementItems: AnnouncementItem[] = [
  { icon: Sparkles, title: 'Un diseño más cuidado', text: 'Formularios, detalles y paneles se renovaron para que todo se vea más ordenado.' },
  { icon: Library, title: 'Sagas que se ordenan solas', text: 'El estado y la categoría de tus sagas ahora se completan a partir de sus libros.' },
  { icon: UserCog, title: 'Tu cuenta, a mano', text: 'Cambia tu usuario, correo o contraseña desde Configuración, sin salir de ahí.' },
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
