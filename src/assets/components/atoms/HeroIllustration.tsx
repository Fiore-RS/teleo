import cozyCorner from '../../images/illustrations/cozy-corner.svg'

interface HeroIllustrationProps {
  className?: string
}

export function HeroIllustration({ className = '' }: HeroIllustrationProps) {
  return <img src={cozyCorner} alt="" className={className} />
}