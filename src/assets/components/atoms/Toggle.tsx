interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  disabled?: boolean
  className?: string
}

export function Toggle({ checked, onChange, label, disabled = false, className = '' }: ToggleProps) {
  return (
    <label
      className={`inline-flex items-center gap-3 cursor-pointer ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    >
      {label && <span className="text-body-lg font-body text-text">{label}</span>}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative w-12 h-7 rounded-full transition-colors shrink-0 ${
          checked ? 'bg-accent-wishlist' : 'bg-border'
        }`}
      >
        <span
          className={`absolute left-1 top-1 w-5 h-5 rounded-full bg-surface transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </label>
  )
}