import type { ReactNode } from 'react'

interface SectionHeaderProps {
  title: string
  variant?: 'title' | 'subtitle'
  rightContent?: ReactNode
  className?: string
}

export function SectionHeader({
  title,
  variant = 'title',
  rightContent,
  className = '',
}: SectionHeaderProps) {
  const isTitle = variant === 'title'

  return (
    <div className={className}>
      <div className="flex items-end justify-between gap-2">
        <h2
          className={`text-accent-wishlist ${
            isTitle ? 'font-display italic text-display-lg' : 'font-body text-body-lg'
          }`}
        >
          {title}
        </h2>
        {rightContent && (
          <span className="text-body-sm font-body text-text-secondary shrink-0 mb-1">
            {rightContent}
          </span>
        )}
      </div>
      <div className="mt-2 border-b-6 border-border" />
    </div>
  )
}