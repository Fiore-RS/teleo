import type { ReactNode } from 'react'

/** Fondo de la tarjeta: el de siempre, o un tinte casi imperceptible de un acento. */
export type CardTint = 'none' | 'orange' | 'pink' | 'magenta'

const tintStyles: Record<CardTint, string> = {
  none: 'bg-surface',
  orange: 'bg-orange-tint',
  pink: 'bg-pink-tint',
  magenta: 'bg-magenta-tint',
}

interface CardProps {
  children: ReactNode
  className?: string
  as?: 'section' | 'div' | 'article'
  labelledBy?: string
  tint?: CardTint
}

/** Tarjeta base del rediseño: esquinas de 24px, borde fino y sombra casi imperceptible. */
export function Card({ children, className = '', as: Tag = 'section', labelledBy, tint = 'none' }: CardProps) {
  return (
    <Tag
      aria-labelledby={labelledBy}
      className={`relative ${tintStyles[tint]} border border-border rounded-card shadow-card p-[18px] ${className}`}
    >
      {children}
    </Tag>
  )
}
