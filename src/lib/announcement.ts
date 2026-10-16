import { CalendarDays, Gift, Share2, Sparkles, type LucideIcon } from 'lucide-react'
import { changelog, type ChangelogEntry } from './changelog'

/** Versión que se anuncia con la hoja "Novedades de Teleo" al entrar a La mesa. Cuando haya
 *  otro lanzamiento grande, se cambia esta versión y sus puntos destacados. */
export const ANNOUNCEMENT_VERSION = '3.2.0'

export interface AnnouncementItem {
  icon: LucideIcon
  title: string
  text: string
}

export const announcementItems: AnnouncementItem[] = [
  { icon: Sparkles, title: 'Tu lectura en Teleo', text: 'Tu mes y tu año en tarjetas para compartir: tus libros, tus páginas, tus géneros, tu racha y tu favorito.' },
  { icon: CalendarDays, title: 'Comparte tu mes', text: 'En Bitácora, en Resumen › Mes, toca "Compartir mi mes" en cualquier mes con libros terminados.' },
  { icon: Share2, title: 'Una tarjeta o todas', text: 'Pasa las tarjetas con un toque y comparte la que estás viendo o todas juntas, listas para tus historias.' },
  { icon: Gift, title: 'Tu año, en diciembre', text: 'Tu año ya está en Resumen › Año. En diciembre te avisamos cuando esté completo para compartir.' },
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
