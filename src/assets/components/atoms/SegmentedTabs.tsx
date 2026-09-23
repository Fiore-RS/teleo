interface SegmentedTabsProps<T extends string> {
  options: { value: T; label: string }[]
  active: T
  onChange: (value: T) => void
}

export function SegmentedTabs<T extends string>({ options, active, onChange }: SegmentedTabsProps<T>) {
  return (
    <div className="flex gap-1 p-1 rounded-full bg-surface border border-border">
      {options.map(({ value, label }) => {
        const isActive = active === value
        return (
          <button
            key={value}
            onClick={() => onChange(value)}
            className={`flex-1 py-2 rounded-full text-body-md font-body transition-colors ${
              isActive ? 'bg-primary text-primary-ink font-bold' : 'text-text-secondary font-medium'
            }`}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}