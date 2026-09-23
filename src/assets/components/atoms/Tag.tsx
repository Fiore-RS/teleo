import { X } from 'lucide-react'

interface TagProps {
  label: string
  onRemove?: () => void
  className?: string
}

export function Tag({ label, onRemove, className = '' }: TagProps) {
  const isEditable = Boolean(onRemove)

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-body-sm font-body font-semibold whitespace-nowrap shrink-0 ${
        isEditable ? 'bg-surface border border-border text-text' : 'bg-primary-soft text-primary-text'
      } ${className}`}
    >
      {label}
      {isEditable && (
        <button
          onClick={onRemove}
          aria-label={`Quitar etiqueta ${label}`}
          className="text-text-secondary"
        >
          <X size={14} strokeWidth={2.2} />
        </button>
      )}
    </span>
  )
}