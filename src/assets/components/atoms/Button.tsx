import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

export type ButtonVariant = 'primary' | 'soft' | 'orange' | 'magenta' | 'outline' | 'outlineOrange'
export type ButtonSize = 'md' | 'sm'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  isLoading?: boolean
  children: ReactNode
}

// Rediseño 2026; desde la V.3.5.0 rectángulos con esquinas redondeadas (rounded-button). "primary" usa el vino de marca; "soft" es el
// botón suave (fondo rubor, texto vino) para acciones secundarias dentro de una tarjeta.
// V.4.0.0: con mouse, los rellenos se oscurecen apenas y los de borde toman un fondo suave
// (hover: de Tailwind solo aplica en pantallas con puntero, no al tocar en el teléfono).
const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-primary-ink hover:brightness-[0.93]',
  soft: 'bg-primary-soft text-primary-text hover:brightness-[0.96]',
  // Acentos de la paleta: naranja (racha, empezar a leer) y magenta (terminar un libro).
  orange: 'bg-orange-button text-on-orange-button hover:brightness-[0.93]',
  magenta: 'bg-magenta text-on-magenta hover:brightness-[0.93]',
  outline: 'bg-transparent border-[1.5px] border-border text-primary-text hover:bg-primary-soft/60',
  outlineOrange: 'bg-transparent border-[1.5px] border-orange-text text-orange-text hover:bg-orange-soft/60',
}

const sizeStyles: Record<ButtonSize, string> = {
  md: 'px-6 py-3 text-body-lg',
  sm: 'px-4 py-2 text-body-sm',
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = true,
  isLoading = false,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || isLoading

  return (
    <button
      {...props}
      disabled={isDisabled}
      className={`inline-flex items-center justify-center gap-2 rounded-button font-body font-bold transition-[background-color,color,border-color,opacity,transform,filter] duration-200 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-text ${
        sizeStyles[size]
      } ${fullWidth ? 'w-full' : ''} ${variantStyles[variant]} ${
        isDisabled ? 'opacity-50 cursor-not-allowed active:scale-100' : 'active:opacity-85'
      } ${className}`}
    >
      {isLoading && <Loader2 size={18} className="animate-spin" />}
      {children}
    </button>
  )
}
