import logoIconDark from '../../images/logo/logo-icon-dark.svg'

interface AuthHeaderProps {
  title: string
  subtitle: string
}

export function AuthHeader({ title, subtitle }: AuthHeaderProps) {
  return (
    <div className="text-center mb-6">
      <div className="mx-auto w-16 h-16 rounded-full bg-text-secondary flex items-center justify-center mb-4">
        <img src={logoIconDark} alt="" className="w-7 h-7" />
      </div>
      <h1 className="font-display text-display-md text-text font-semibold">{title}</h1>
      <p className="font-body text-body-md text-text-secondary mt-2">{subtitle}</p>
    </div>
  )
}