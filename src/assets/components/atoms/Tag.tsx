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
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-body-md font-body text-text whitespace-nowrap shrink-0 ${
        isEditable ? 'bg-surface' : 'bg-border'
      } ${className}`}
    >
      {label}
      {isEditable && (
        <button
          onClick={onRemove}
          aria-label={`Quitar etiqueta ${label}`}
          className="text-text-secondary"
        >
          <X size={16} strokeWidth={2} />
        </button>
      )}
    </span>
  )
}