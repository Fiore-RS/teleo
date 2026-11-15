import { useId } from 'react'
import { bannerSvg, scaleSvgOpacity, type BannerId } from '../../../lib/banners'
import { useBannerArtBoost } from '../../../hooks/useBannerArtBoost'

interface BannerArtProps {
  banner: BannerId
  className?: string
  /** Clase del color del dibujo (usa currentColor). Por defecto el color de dibujo del tema
   *  (banner-ink): el crema, o blanco en los temas con texto oscuro sobre el principal. */
  colorClass?: string
  /** Versión ancha del dibujo (1080 × 230), para el perfil en escritorio (V.4.2.0). */
  ancho?: boolean
}

/** Dibujo del banner (V.2.1.0), a lo ancho y alto de su contenedor. Se pinta con banner-ink
 *  (V.3.6.0; antes primary-ink, que en Margarita es oscuro y dejaba los dibujos en negro), así
 *  que va dentro de un contenedor con el degradado del tema (from-primary to-rose) y toma los
 *  colores del tema activo. */
export function BannerArt({ banner, className = '', colorClass = 'text-banner-ink', ancho = false }: BannerArtProps) {
  // Ids únicos por dibujo: en el catálogo hay varios banners a la vez.
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const boost = useBannerArtBoost()
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 ${colorClass} [&>svg]:absolute [&>svg]:inset-0 [&>svg]:h-full [&>svg]:w-full ${className}`}
      dangerouslySetInnerHTML={{ __html: scaleSvgOpacity(bannerSvg(banner, uid, ancho), boost) }}
    />
  )
}
