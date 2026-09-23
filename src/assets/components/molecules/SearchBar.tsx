import { Search } from 'lucide-react'
import type { ComponentPropsWithRef } from 'react'

interface SearchBarProps extends Omit<ComponentPropsWithRef<'input'>, 'type'> {
  className?: string
}

export function SearchBar({ className = '', ...props }: SearchBarProps) {
  return (
    <div className={`relative w-full ${className}`}>
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-text pointer-events-none">
        <Search size={18} strokeWidth={1.75} />
      </span>
      <input
        {...props}
        type="text"
        placeholder={props.placeholder ?? 'Buscar por título, autor, género, etc...'}
        className="w-full bg-surface border border-border rounded-full py-3 pl-11 pr-4 text-body-lg font-body text-text placeholder:text-text-muted focus:outline-none focus:border-primary-text transition-colors"
      />
    </div>
  )
}
