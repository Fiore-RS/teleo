import { Search, Camera } from 'lucide-react'
import type { InputHTMLAttributes } from 'react'

interface SearchBarProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  onCameraClick?: () => void
  className?: string
}

export function SearchBar({ onCameraClick, className = '', ...props }: SearchBarProps) {
  return (
    <div className={`relative w-full ${className}`}>
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none">
        <Search size={18} strokeWidth={1.75} />
      </span>
      <input
        {...props}
        type="text"
        placeholder={props.placeholder ?? 'Buscar por título, autor, género, etc...'}
        className="w-full bg-surface border border-border rounded-xl py-3 pl-11 pr-11 text-body-lg font-body text-text placeholder:text-text-secondary focus:outline-none focus:border-accent-wishlist transition-colors"
      />
      <button
        type="button"
        onClick={onCameraClick}
        aria-label="Escanear código de barras"
        className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary"
      >
        <Camera size={18} strokeWidth={1.75} />
      </button>
    </div>
  )
}