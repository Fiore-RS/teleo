import { useTheme } from '../../../hooks/useTheme'
import logoFull from '../../images/logo/logo-full.svg'
import logoFullDark from '../../images/logo/logo-full-dark.svg'
import logoIcon from '../../images/logo/logo-icon.svg'
import logoIconDark from '../../images/logo/logo-icon-dark.svg'

type LogoVariant = 'full' | 'icon'

interface LogoProps {
  variant?: LogoVariant
  className?: string
}

const sources: Record<LogoVariant, { light: string; dark: string }> = {
  full: { light: logoFull, dark: logoFullDark },
  icon: { light: logoIcon, dark: logoIconDark },
}

export function Logo({ variant = 'full', className = '' }: LogoProps) {
  const { resolvedTheme } = useTheme()
  const src = sources[variant][resolvedTheme]

  return <img src={src} alt="Teleo" className={className} />
}