import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

export type ButtonVariant = 'primary' | 'amber' | 'green' | 'slate' | 'outline'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  fullWidth?: boolean
  isLoading?: boolean
  children: ReactNode
}

const filledStyles: Record<Exclude<ButtonVariant, 'outline'>, string> = {
  primary: 'bg-accent-wishlist text-surface',
  amber: 'bg-accent-reading text-surface',
  green: 'bg-accent-finished text-surface',
  slate: 'bg-state-pending text-surface',
}

const outlineStyles = 'bg-transparent border-2 border-state-pending text-state-pending'

export function Button({
  variant = 'primary',
  fullWidth = true,
  isLoading = false,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || isLoading
  const colorStyle = variant === 'outline' ? outlineStyles : filledStyles[variant]

  return (
    <button
      {...props}
      disabled={isDisabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-body-lg font-body font-medium transition-opacity ${
        fullWidth ? 'w-full' : ''
      } ${colorStyle} ${
        isDisabled ? 'opacity-50 cursor-not-allowed' : 'active:opacity-80'
      } ${className}`}
    >
      {isLoading && <Loader2 size={18} className="animate-spin" />}
      {children}
    </button>
  )
}