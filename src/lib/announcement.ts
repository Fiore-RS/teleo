import {
  BookHeart, CalendarClock, CalendarDays, Coins, Image, LibraryBig, NotebookPen, Settings, Shuffle, UserRound,
  type LucideIcon,
} from 'lucide-react'

/** Versión que se anuncia con la hoja "Novedades de Teleo" al entrar a La mesa. Cuando haya
 *  otro lanzamiento grande, se cambia esta versión y sus puntos destacados. */
export const ANNOUNCEMENT_VERSION = '2.0.0'

export interface AnnouncementItem {
  icon: LucideIcon
  title: string
  text: string
}

export const announcementItems: AnnouncementItem[] = [
  { icon: CalendarDays, title: 'Calendario de lectura', text: 'Toca tu racha en La mesa para ver tus días leídos, tu racha más larga y los números de cada mes.' },
  { icon: CalendarClock, title: 'Lanzamientos', text: 'Anota los libros que esperas y mira cuánto falta para que salgan.' },
  { icon: UserRound, title: 'Perfil renovado', text: 'Tu nickname, tus números, tu actividad del mes, tu lista de temporada y tus abandonados.' },
  { icon: LibraryBig, title: 'Resumen', text: 'En Bitácora, tus libros de cada mes y año, y tus favoritos del mes y del año.' },
  { icon: Coins, title: 'Compras', text: 'Cuánto has invertido en tu biblioteca, libro por libro.' },
  { icon: Image, title: 'Tarjeta para historias', text: 'Comparte tu perfil con las portadas de tu última lectura, la actual y la próxima.' },
  { icon: Shuffle, title: '¿Qué leo ahora?', text: 'Teleo elige al azar uno de tus pendientes cuando no sabes con cuál seguir.' },
  { icon: BookHeart, title: 'Fechas sin reseña', text: 'Guarda cuándo empezaste y terminaste un libro sin tener que escribir la reseña.' },
  { icon: NotebookPen, title: 'Reseñas completas', text: 'Agrega calificaciones personalizadas y citas desde la primera vez que escribes una reseña.' },
  { icon: Settings, title: 'Configuración ordenada', text: 'Novedades, Detrás de Teleo, privacidad y términos, todo en su lugar.' },
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
