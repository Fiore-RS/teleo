import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  as?: 'section' | 'div' | 'article'
  labelledBy?: string
}

/** Tarjeta base del rediseño: esquinas de 24px, borde fino y sombra casi imperceptible. */
export function Card({ children, className = '', as: Tag = 'section', labelledBy }: CardProps) {
  return (
    <Tag
      aria-labelledby={labelledBy}
      className={`relative bg-surface border border-border rounded-card shadow-card p-[18px] ${className}`}
    >
      {children}
    </Tag>
  )
}
