import {
  BookUp, Gauge, Gift, Palette, PanelTop, PieChart, Quote, SunMoon,
  type LucideIcon,
} from 'lucide-react'

/** Versión que se anuncia con la hoja "Novedades de Teleo" al entrar a La mesa. Cuando haya
 *  otro lanzamiento grande, se cambia esta versión y sus puntos destacados. */
export const ANNOUNCEMENT_VERSION = '2.1.0'

export interface AnnouncementItem {
  icon: LucideIcon
  title: string
  text: string
}

export const announcementItems: AnnouncementItem[] = [
  { icon: Palette, title: 'Temas de color', text: 'Seis temas para toda la app. Elige el tuyo en Configuración › Apariencia.' },
  { icon: PanelTop, title: 'Banners', text: 'Diez dibujos para la cabecera de tu perfil. Cámbialo desde el lápiz.' },
  { icon: SunMoon, title: 'Modo del teléfono', text: 'Teleo ahora sigue el modo claro u oscuro de tu teléfono. Si prefieres uno fijo, cámbialo en Configuración › Apariencia.' },
  { icon: Quote, title: 'Mis citas', text: 'Todas tus citas en Cuaderno. Anótalas mientras lees y compártelas como imagen.' },
  { icon: BookUp, title: 'Importar desde Goodreads', text: 'Trae tu biblioteca con sus sagas y portadas desde Configuración › Tus datos.' },
  { icon: Gift, title: 'Regalos', text: 'Marca los libros que te regalaron y anota quién te los dio.' },
  { icon: Gauge, title: 'Ritmo de lectura', text: 'En La mesa ves cuándo terminarías el libro que estás leyendo.' },
  { icon: PieChart, title: 'Lo que leíste', text: 'En Bitácora, tus lecturas por categoría y formato, de siempre y de cada año.' },
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
