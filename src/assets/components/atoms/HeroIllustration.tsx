// WebP de 900×900 (29 KB). Antes era un SVG de 1,5 MB que solo envolvía un PNG, y la app
// instalada lo descargaba entero en cada actualización.
import cozyCorner from '../../images/illustrations/cozy-corner.webp'

interface HeroIllustrationProps {
  className?: string
}

export function HeroIllustration({ className = '' }: HeroIllustrationProps) {
  return <img src={cozyCorner} alt="" width={900} height={900} className={className} />
}