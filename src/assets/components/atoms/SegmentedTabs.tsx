interface SegmentedTabsProps<T extends string> {
  options: { value: T; label: string }[]
  active: T
  onChange: (value: T) => void
}

export function SegmentedTabs<T extends string>({ options, active, onChange }: SegmentedTabsProps<T>) {
  return (
    <div className="flex gap-1 p-1 rounded-2xl bg-border/60">
      {options.map(({ value, label }) => {
        const isActive = active === value
        return (
          <button
            key={value}
            onClick={() => onChange(value)}
            className={`flex-1 py-2.5 rounded-xl text-body-md font-body font-medium transition-colors ${
              isActive ? 'bg-accent-wishlist text-surface' : 'text-text-secondary'
            }`}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}