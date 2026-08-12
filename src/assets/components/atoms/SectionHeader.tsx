interface SectionHeaderProps {
  title: string
  variant?: 'title' | 'subtitle'
  className?: string
}

export function SectionHeader({ title, variant = 'title', className = '' }: SectionHeaderProps) {
  const isTitle = variant === 'title'

  return (
    <div className={className}>
      <h2
        className={`text-accent-wishlist ${
          isTitle
            ? 'font-display italic text-display-lg'
            : 'font-body text-body-lg'
        }`}
      >
        {title}
      </h2>
      <div className="mt-2 border-b-6 border-border" />
    </div>
  )
}