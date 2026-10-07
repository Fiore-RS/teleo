import { useId, type ReactNode } from 'react'
import { ChevronRight, type LucideIcon } from 'lucide-react'

/** Fondo de la tarjeta: el de siempre, o un tinte casi imperceptible de un acento. */
export type CardTint = 'none' | 'orange' | 'pink' | 'magenta'

/** Color de la pestaña de separador (V.3.0.0, "Cuaderno"): el vino de marca o un acento. */
export type CardTone = 'brand' | 'orange' | 'pink' | 'magenta'

const tintStyles: Record<CardTint, string> = {
  none: 'bg-surface',
  orange: 'bg-orange-tint',
  pink: 'bg-pink-tint',
  magenta: 'bg-magenta-tint',
}

const toneText: Record<CardTone, string> = {
  brand: 'text-primary-text',
  orange: 'text-orange-text',
  pink: 'text-pink-text',
  magenta: 'text-magenta-text',
}

/** Cada tono trae su tinte; el vino usa el fondo de siempre. */
const toneTint: Record<CardTone, CardTint> = {
  brand: 'none',
  orange: 'orange',
  pink: 'pink',
  magenta: 'magenta',
}

export interface CardTab {
  label: string
  icon?: LucideIcon
}

interface CardProps {
  children: ReactNode
  className?: string
  as?: 'section' | 'div' | 'article'
  labelledBy?: string
  /** Tinte del fondo. Con pestaña, por defecto es el del tono. */
  tint?: CardTint
  /** Pestaña de separador arriba a la izquierda, con ícono y nombre (reemplaza a Eyebrow). */
  tab?: CardTab
  /** Color de la pestaña. Por defecto el vino de marca. */
  tone?: CardTone
  /** Enlace o botón pequeño a la derecha, a la altura de la pestaña ("Ver todos"). */
  action?: ReactNode
  /** Relleno de la tarjeta con pestaña. Por defecto 18px; las listas plegables usan menos. */
  padding?: string
}

/** Tarjeta base: esquinas de 24px, borde fino y sombra casi imperceptible. V.3.0.0: puede
 *  llevar una pestaña de separador, como las hojas de un cuaderno con índice. La pestaña
 *  comparte fondo y borde con la tarjeta y tapa la línea de arriba para verse de una pieza;
 *  por eso la esquina superior izquierda queda recta. */
export function Card({
  children,
  className = '',
  as: Tag = 'section',
  labelledBy,
  tint,
  tab,
  tone = 'brand',
  action,
  padding = 'p-[18px]',
}: CardProps) {
  const tabId = useId()
  const bg = tintStyles[tint ?? (tab ? toneTint[tone] : 'none')]

  if (!tab) {
    return (
      <Tag
        aria-labelledby={labelledBy}
        className={`relative ${bg} border border-border rounded-card shadow-card p-[18px] ${className}`}
      >
        {children}
      </Tag>
    )
  }

  const Icon = tab.icon

  // El espacio de la pestaña va como padding de un contenedor y no como margen de la
  // tarjeta: así no se junta con el margen de la tarjeta de arriba (space-y) y la pestaña
  // nunca queda pegada a ella.
  return (
    <Tag aria-labelledby={labelledBy ?? tabId} className={`relative pt-[31px] ${className}`}>
      <div className={`relative ${bg} border border-border rounded-card rounded-tl-none shadow-card ${padding}`}>
        <h2
          id={tabId}
          className={`absolute -top-[31px] -left-px h-[31px] max-w-[calc(100%-6rem)] px-4 flex items-center gap-[7px] ${bg} border border-border border-b-0 rounded-t-[14px] font-body font-bold text-body-md ${toneText[tone]}`}
        >
          {Icon && <Icon size={16} strokeWidth={2} aria-hidden="true" className="shrink-0" />}
          <span className="truncate">{tab.label}</span>
          {/* Tapa la línea de arriba de la tarjeta bajo la pestaña. */}
          <span aria-hidden="true" className={`absolute -bottom-0.5 inset-x-0 h-[3px] ${bg}`} />
        </h2>
        {action && <div className={`absolute -top-[29px] right-1.5 ${toneText[tone]}`}>{action}</div>}
        {children}
      </div>
    </Tag>
  )
}

interface CardActionProps {
  children: ReactNode
  onClick: () => void
}

/** Enlace de la pestaña ("Ver todos ›"), en el color del tono de la tarjeta. */
export function CardAction({ children, onClick }: CardActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-0.5 py-1 font-body font-bold text-body-md whitespace-nowrap rounded-full focus-visible:outline-2 focus-visible:outline-primary-text"
    >
      {children}
      <ChevronRight size={16} aria-hidden="true" />
    </button>
  )
}
