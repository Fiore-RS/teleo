import type { ReactNode } from 'react'

interface HorizontalScrollerProps {
  children: ReactNode
  className?: string
}

export function HorizontalScroller({ children, className = '' }: HorizontalScrollerProps) {
  return (
    <div className={`flex gap-2 overflow-x-auto scrollbar-hide ${className}`}>
      {children}
    </div>
  )
}