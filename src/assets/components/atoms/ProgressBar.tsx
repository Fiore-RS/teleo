interface ProgressBarProps {
  percent: number
  color?: string
  className?: string
}

export function ProgressBar({ percent, color = 'var(--color-accent-reading)', className = '' }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percent))

  return (
    <div className={`w-full h-2 rounded-full bg-border overflow-hidden ${className}`}>
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${clamped}%`, backgroundColor: color }}
      />
    </div>
  )
}