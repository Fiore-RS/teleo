import {
  Star, Candy, Crown, Gem, Sparkle,
  Droplet, Skull, Ghost, Snail, Leaf,
  Drama, Heart, Swords, Flame, Wine,
  type LucideIcon,
} from 'lucide-react'

export type RatingShape =
  | 'star' | 'candy' | 'crown' | 'gem' | 'sparkle'
  | 'droplet' | 'skull' | 'ghost' | 'snail' | 'leaf'
  | 'drama' | 'heart' | 'swords' | 'flame' | 'wine'

export type RatingState = 'empty' | 'half' | 'full'

const shapeIcon: Record<RatingShape, LucideIcon> = {
  star: Star, candy: Candy, crown: Crown, gem: Gem, sparkle: Sparkle,
  droplet: Droplet, skull: Skull, ghost: Ghost, snail: Snail, leaf: Leaf,
  drama: Drama, heart: Heart, swords: Swords, flame: Flame, wine: Wine,
}

interface RatingIconProps {
  shape: RatingShape
  state: RatingState
  color: string
  size?: number
}

export function RatingIcon({ shape, state, color, size = 24 }: RatingIconProps) {
  const Icon = shapeIcon[shape]
  const fillPercent = state === 'full' ? 100 : state === 'half' ? 50 : 0

  return (
    <span className="relative inline-block shrink-0" style={{ width: size, height: size }}>
      <Icon size={size} strokeWidth={1.75} className="absolute inset-0" style={{ color }} />
      {fillPercent > 0 && (
        <span className="absolute inset-0 overflow-hidden" style={{ width: `${fillPercent}%` }}>
          <Icon size={size} strokeWidth={1.75} fill={color} style={{ color }} />
        </span>
      )}
    </span>
  )
}