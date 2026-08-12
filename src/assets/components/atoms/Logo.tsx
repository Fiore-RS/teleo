import { useTheme } from '../../../hooks/useTheme'
import logoFull from '../../images/logo/logo-full.svg'
import logoFullDark from '../../images/logo/logo-full-dark.svg'
import logoIcon from '../../images/logo/logo-icon.svg'
import logoIconDark from '../../images/logo/logo-icon-dark.svg'

type LogoVariant = 'full' | 'icon'

interface LogoProps {
  variant?: LogoVariant
  onClick?: () => void
  className?: string
}

const sources: Record<LogoVariant, { light: string; dark: string }> = {
  full: { light: logoFull, dark: logoFullDark },
  icon: { light: logoIcon, dark: logoIconDark },
}

export function Logo({ variant = 'full', onClick, className = '' }: LogoProps) {
  const { resolvedTheme } = useTheme()
  const src = sources[variant][resolvedTheme]
  const isClickable = Boolean(onClick)
  const Wrapper = isClickable ? 'button' : 'div'

  return (
    <Wrapper
      onClick={onClick}
      type={isClickable ? 'button' : undefined}
      aria-label={isClickable ? 'Ir al inicio' : undefined}
      className="inline-block"
    >
      <img src={src} alt="Teleo" className={className} />
    </Wrapper>
  )
}