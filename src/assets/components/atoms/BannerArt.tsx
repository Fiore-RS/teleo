import { useId } from 'react'
import { bannerSvg, type BannerId } from '../../../lib/banners'

interface BannerArtProps {
  banner: BannerId
  className?: string
}

/** Dibujo del banner (V.2.1.0), a lo ancho y alto de su contenedor. Se pinta con el color de
 *  texto primary-ink, así que va dentro de un contenedor con el degradado del tema
 *  (from-primary to-rose) y toma los colores del tema activo. */
export function BannerArt({ banner, className = '' }: BannerArtProps) {
  // Ids únicos por dibujo: en el catálogo hay varios banners a la vez.
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 text-primary-ink [&>svg]:absolute [&>svg]:inset-0 [&>svg]:h-full [&>svg]:w-full ${className}`}
      dangerouslySetInnerHTML={{ __html: bannerSvg(banner, uid) }}
    />
  )
}
