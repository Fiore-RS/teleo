import { Compass, Filter, Pause, Tags, type LucideIcon } from 'lucide-react'
import { changelog, type ChangelogEntry } from './changelog'

/** Versión que se anuncia con la hoja "Novedades de Teleo" al entrar a La mesa. Cuando haya
 *  otro lanzamiento grande, se cambia esta versión y sus puntos destacados. */
export const ANNOUNCEMENT_VERSION = '3.1.0'

export interface AnnouncementItem {
  icon: LucideIcon
  title: string
  text: string
}

export const announcementItems: AnnouncementItem[] = [
  { icon: Tags, title: 'Género, ánimo y ritmo', text: 'Cuenta cómo es cada libro: hasta 3 géneros, hasta 3 ánimos (también los tuyos) y su ritmo. Al terminar uno, Teleo te lo pregunta.' },
  { icon: Filter, title: 'Encuentra lo que buscas', text: 'Filtra tu estante y "¿Qué leo ahora?" por género, ánimo, ritmo o etiqueta, y mira qué es lo que más lees en Bitácora.' },
  { icon: Pause, title: 'En pausa', text: 'Deja un libro a un lado sin abandonarlo. Tu progreso se guarda y lo retomas cuando quieras.' },
  { icon: Compass, title: 'Sigue en la saga', text: 'Al terminar un libro de una saga, Teleo te propone el siguiente.' },
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
