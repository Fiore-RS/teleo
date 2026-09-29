import type { InputHTMLAttributes } from 'react'
import type { LucideIcon } from 'lucide-react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: LucideIcon
  iconPosition?: 'left' | 'right'
  onIconClick?: () => void
  /** Sin caja (fondo, borde ni relleno): para filas compactas de formulario y campos en
   *  línea, donde el contenedor ya da el marco. El estilo que falte va en `className`. */
  bare?: boolean
  className?: string
}

export function Input({
  icon: Icon,
  iconPosition = 'left',
  onIconClick,
  bare = false,
  className = '',
  ...props
}: InputProps) {
  const hasIcon = Boolean(Icon)

  if (bare) {
    return (
      <input
        {...props}
        className={`w-full min-w-0 bg-transparent font-body text-text placeholder:text-text-muted focus:outline-none transition-colors ${className}`}
      />
    )
  }

  return (
    <div className="relative w-full">
      {hasIcon && iconPosition === 'left' && (
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none">
          {Icon && <Icon size={18} strokeWidth={1.75} />}
        </span>
      )}
      <input
        {...props}
        className={`w-full bg-surface-2 border border-border rounded-2xl py-3 text-body-lg font-body text-text placeholder:text-text-muted focus:outline-none focus:border-primary-text transition-colors ${
          hasIcon && iconPosition === 'left' ? 'pl-11 pr-4' : ''
        } ${hasIcon && iconPosition === 'right' ? 'pl-4 pr-11' : ''} ${
          !hasIcon ? 'px-4' : ''
        } ${className}`}
      />
      {hasIcon && iconPosition === 'right' && (
        <button
          type="button"
          onClick={onIconClick}
          disabled={!onIconClick}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary disabled:cursor-default"
        >
          {Icon && <Icon size={18} strokeWidth={1.75} />}
        </button>
      )}
    </div>
  )
}