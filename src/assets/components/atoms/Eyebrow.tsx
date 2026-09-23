import type { LucideIcon } from 'lucide-react'

/** Color de cada encabezado, siempre desde la paleta (vino de marca o un acento). Los colores
 *  de estado de siempre quedan solo para la esquina doblada (DogEar). */
export type EyebrowTone = 'brand' | 'orange' | 'pink' | 'magenta'

const toneStyles: Record<EyebrowTone, { text: string; chip: string }> = {
  brand: { text: 'text-primary-text', chip: 'bg-primary-soft' },
  orange: { text: 'text-orange-text', chip: 'bg-orange-soft' },
  pink: { text: 'text-pink-text', chip: 'bg-pink-soft' },
  magenta: { text: 'text-magenta-text', chip: 'bg-magenta-soft' },
}

interface EyebrowProps {
  children: string
  icon?: LucideIcon
  /** Por defecto el vino de marca. */
  tone?: EyebrowTone
  className?: string
  id?: string
}

/** Etiqueta pequeña en mayúsculas espaciadas que encabeza cada tarjeta ("LEYENDO AHORA"),
 *  con el ícono dentro de un círculo suave del mismo color. */
export function Eyebrow({ children, icon: Icon, tone = 'brand', className = '', id }: EyebrowProps) {
  const style = toneStyles[tone]

  return (
    <p
      id={id}
      className={`flex items-center gap-2 font-body font-bold text-body-sm uppercase tracking-[0.14em] ${style.text} ${className}`}
    >
      {Icon && (
        <span aria-hidden="true" className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center ${style.chip}`}>
          <Icon size={15} strokeWidth={2} />
        </span>
      )}
      {children}
    </p>
  )
}
