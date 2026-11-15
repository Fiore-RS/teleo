import { useId, type ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { HojaNestContext, useHojaMode } from '../../../lib/hojaMode'

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

/** Pestaña de separador. Solo texto desde el 26 oct 2026: ícono + texto en cada título se veía
 *  genérico; la pestaña sola ya es la marca del estilo Cuaderno. */
export interface CardTab {
  label: string
}

interface CardProps {
  children: ReactNode
  className?: string
  as?: 'section' | 'div' | 'article'
  labelledBy?: string
  /** Tinte del fondo. Con pestaña, por defecto es el del tono. */
  tint?: CardTint
  /** Pestaña de separador arriba a la izquierda, con el nombre. */
  tab?: CardTab
  /** Color de la pestaña. Por defecto el vino de marca. */
  tone?: CardTone
  /** Enlace o botón pequeño a la derecha, a la altura de la pestaña ("Ver todos"). */
  action?: ReactNode
  /** Relleno de la tarjeta con pestaña. Por defecto 18px; las listas plegables usan menos. */
  padding?: string
  /** Tarjeta que solo agrupa filas plegables ("Más de tu bitácora"): en modo hoja no se
   *  dibuja, y sus filas van como hojas sueltas en dos columnas. */
  group?: boolean
  /** Título sobre las hojas del grupo en modo hoja (por ejemplo "De toda tu biblioteca"). */
  groupTitle?: string
}

const hojaToneText: Record<CardTone, string> = {
  brand: 'text-primary-text',
  orange: 'text-orange-text',
  pink: 'text-pink-text',
  magenta: 'text-magenta-text',
}

const hojaToneSoft: Record<CardTone, string> = {
  brand: 'var(--color-primary-soft)',
  orange: 'var(--color-orange-soft)',
  pink: 'var(--color-pink-soft)',
  magenta: 'var(--color-magenta-soft)',
}

/** Hoja de Bitácora (V.4.2.0), como las notas de las citas del Cuaderno: papel con esquinas
 *  redondeadas, borde fino, sombra suave y la esquina de arriba a la derecha doblada, del
 *  color del tono. El título va arriba en Fraunces. La usan las tarjetas de Bitácora en tableta
 *  y computadora. */
export function Hoja({
  title,
  tone = 'brand',
  action,
  children,
  className = '',
  as: Tag = 'section',
}: {
  title?: ReactNode
  tone?: CardTone
  action?: ReactNode
  children: ReactNode
  className?: string
  as?: 'section' | 'div' | 'article'
}) {
  const titleId = useId()
  return (
    <Tag
      aria-labelledby={title ? titleId : undefined}
      className={`relative bg-surface border border-border rounded-2xl shadow-card px-4 pt-4 pb-4 ${className}`}
    >
      {/* Esquina doblada; el pedazo de fuera toma el color de lo que hay detrás (la mesa). */}
      <span
        aria-hidden="true"
        className="absolute -top-px -right-px w-[22px] h-[22px] rounded-tr-2xl"
        style={{ background: `linear-gradient(45deg, ${hojaToneSoft[tone]} 50%, var(--tapa-papel) 50%)` }}
      />
      {(title || action) && (
        <div className="flex items-start justify-between gap-3 mb-3 pr-5">
          {title && (
            <h2 id={titleId} className={`font-display font-semibold text-[18px] leading-tight ${hojaToneText[tone]}`}>
              {title}
            </h2>
          )}
          {action && <div className={`-mt-1 shrink-0 ${hojaToneText[tone]}`}>{action}</div>}
        </div>
      )}
      <HojaNestContext.Provider value={true}>{children}</HojaNestContext.Provider>
    </Tag>
  )
}

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
  group = false,
  groupTitle,
}: CardProps) {
  const tabId = useId()
  const hojaMode = useHojaMode()

  if (hojaMode && group) {
    return (
      <div className={className}>
        {groupTitle && <h2 className="smallcaps text-text-secondary mb-3">{groupTitle}</h2>}
        <div className="hojas-columnas">{children}</div>
      </div>
    )
  }
  if (hojaMode && tab) {
    return (
      <Hoja title={tab.label} tone={tone} action={action} as={Tag} className={className}>
        {children}
      </Hoja>
    )
  }
  const bg = tintStyles[tint ?? (tab ? toneTint[tone] : 'none')]

  if (!tab) {
    return (
      <Tag
        aria-labelledby={labelledBy}
        className={`relative ${bg} border border-border border-t-edge-top rounded-card shadow-card p-[18px] ${className}`}
      >
        {children}
      </Tag>
    )
  }

  // El espacio de la pestaña va como padding de un contenedor y no como margen de la
  // tarjeta: así no se junta con el margen de la tarjeta de arriba (space-y) y la pestaña
  // nunca queda pegada a ella.
  return (
    <Tag aria-labelledby={labelledBy ?? tabId} className={`relative pt-[31px] ${className}`}>
      <div className={`relative ${bg} border border-border border-t-edge-top rounded-card rounded-tl-none shadow-card ${padding}`}>
        <h2
          id={tabId}
          className={`absolute -top-[31px] -left-px h-[31px] max-w-[calc(100%-6rem)] px-4 flex items-center gap-[7px] ${bg} border border-border border-t-edge-top border-b-0 rounded-t-[14px] shadow-tab font-body font-bold text-body-md ${toneText[tone]}`}
        >
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
      className="inline-flex items-center gap-0.5 py-1 font-body font-bold text-body-md whitespace-nowrap rounded-chip hover:underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-primary-text"
    >
      {children}
      <ChevronRight size={16} aria-hidden="true" />
    </button>
  )
}
