import type { LucideIcon } from 'lucide-react'

interface EyebrowProps {
  children: string
  icon?: LucideIcon
  /** Color del texto e ícono. Por defecto el vino de marca. */
  color?: string
  className?: string
  id?: string
}

/** Etiqueta pequeña en mayúsculas espaciadas que encabeza cada tarjeta ("LEYENDO AHORA"). */
export function Eyebrow({ children, icon: Icon, color, className = '', id }: EyebrowProps) {
  return (
    <p
      id={id}
      className={`flex items-center gap-2 font-body font-bold text-body-sm uppercase tracking-[0.14em] ${
        color ? '' : 'text-primary-text'
      } ${className}`}
      style={color ? { color } : undefined}
    >
      {Icon && <Icon size={16} strokeWidth={2} className="shrink-0" />}
      {children}
    </p>
  )
}
