import { ChevronDown } from 'lucide-react'
import type { SelectHTMLAttributes } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[]
}

export function Select({ options, className = '', ...props }: SelectProps) {
  return (
    <div className="relative w-full">
      <select
        {...props}
        className={`w-full appearance-none bg-surface border border-border rounded-xl py-3 pl-4 pr-10 text-body-lg font-body text-text focus:outline-none focus:border-accent-wishlist transition-colors ${className}`}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
    </div>
  )
}