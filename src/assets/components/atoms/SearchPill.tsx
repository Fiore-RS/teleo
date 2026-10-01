import { Search } from 'lucide-react'

interface SearchPillProps {
  value: string
  onChange: (value: string) => void
  placeholder: string
  autoFocus?: boolean
  className?: string
}

/** Barra de búsqueda redonda de las hojas rediseñadas en la V.2.2.0 (elegir libro, selectores). */
export function SearchPill({ value, onChange, placeholder, autoFocus, className = '' }: SearchPillProps) {
  return (
    <div className={`flex items-center gap-2 bg-surface-2 border border-border rounded-full px-4 py-2.5 focus-within:border-primary-text transition-colors ${className}`}>
      <Search size={17} className="text-text-muted shrink-0" aria-hidden="true" />
      <input
        aria-label={placeholder}
        autoFocus={autoFocus}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 min-w-0 bg-transparent focus:outline-none font-body text-body-lg text-text placeholder:text-text-muted"
      />
    </div>
  )
}
