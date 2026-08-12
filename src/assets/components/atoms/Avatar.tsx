import { Camera } from 'lucide-react'

type AvatarVariant = 'user' | 'character'
type AvatarSize = 'sm' | 'md' | 'lg'

interface AvatarProps {
  src?: string
  alt?: string
  variant?: AvatarVariant
  size?: AvatarSize
  onClick?: () => void
  className?: string
}

const sizeStyles: Record<AvatarSize, string> = {
  sm: 'w-12 h-12',
  md: 'w-20 h-20',
  lg: 'w-28 h-28',
}

const iconSize: Record<AvatarSize, number> = {
  sm: 18,
  md: 28,
  lg: 36,
}

const variantBg: Record<AvatarVariant, string> = {
  user: 'bg-accent-wishlist',
  character: 'bg-border',
}

const variantIconColor: Record<AvatarVariant, string> = {
  user: 'text-surface',
  character: 'text-text-secondary',
}

export function Avatar({
  src,
  alt = '',
  variant = 'user',
  size = 'md',
  onClick,
  className = '',
}: AvatarProps) {
  const isClickable = Boolean(onClick)
  const Wrapper = isClickable ? 'button' : 'div'

  return (
    <Wrapper
      onClick={onClick}
      type={isClickable ? 'button' : undefined}
      aria-label={isClickable ? 'Cambiar foto' : undefined}
      className={`relative rounded-full overflow-hidden shrink-0 flex items-center justify-center ${
        sizeStyles[size]
      } ${!src ? variantBg[variant] : 'bg-border'} ${className}`}
    >
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <Camera size={iconSize[size]} strokeWidth={1.75} className={variantIconColor[variant]} />
      )}
    </Wrapper>
  )
}