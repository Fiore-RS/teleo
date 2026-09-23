interface ProgressBarProps {
  percent: number
  /** Color sólido opcional. Si no se pasa, usa el degradado de marca (vino → rosa). */
  color?: string
  className?: string
}

export function ProgressBar({ percent, color, className = '' }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percent))
  const fill = color ?? 'linear-gradient(90deg, var(--color-primary), var(--color-rose))'

  return (
    <div className={`w-full h-2 rounded-full bg-surface-2 border border-border overflow-hidden ${className}`}>
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${clamped}%`, background: fill }}
      />
    </div>
  )
}
