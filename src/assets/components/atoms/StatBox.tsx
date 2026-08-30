interface StatBoxProps {
  label: string
  value: string
  className?: string
}

export function StatBox({ label, value, className = '' }: StatBoxProps) {
  return (
    <div className={className}>
      <p className="text-body-md text-text-secondary mb-2">{label}</p>
      <div className="bg-surface border border-border rounded-xl py-4 px-3 text-center">
        <p className="font-body text-body-lg font-semibold text-text">{value}</p>
      </div>
    </div>
  )
}