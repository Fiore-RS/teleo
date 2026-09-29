import { Quote, TriangleAlert, type LucideIcon } from 'lucide-react'

/** Versión que se anuncia con la hoja "Novedades de Teleo" al entrar a La mesa. Cuando haya
 *  otro lanzamiento grande, se cambia esta versión y sus puntos destacados. */
export const ANNOUNCEMENT_VERSION = '2.1.1'

export interface AnnouncementItem {
  icon: LucideIcon
  title: string
  text: string
}

export const announcementItems: AnnouncementItem[] = [
  { icon: TriangleAlert, title: 'Avisos de contenido', text: 'Marca los temas sensibles de un libro en tu reseña. Quedan ocultos hasta que alguien toque Ver.' },
  { icon: Quote, title: 'Tus citas, a tu manera', text: 'Edita o elimina tus citas desde el menú de cada una en Mis citas.' },
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
