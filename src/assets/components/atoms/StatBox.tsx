interface StatBoxProps {
  label: string
  value: string
}

export function StatBox({ label, value }: StatBoxProps) {
  return (
    <div className="bg-bg rounded-xl p-3">
      <p className="text-body-sm text-text-secondary">{label}</p>
      <p className="font-display text-display-md text-text mt-1">{value}</p>
    </div>
  )
}