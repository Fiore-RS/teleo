interface ProgressBarProps {
  percent: number
  /** Color sólido opcional. Si no se pasa, usa el degradado de marca (vino → rosa). */
  color?: string
  className?: string
  /** 'firme' (V.3.5.0): esquinas menos redondeadas, para ir con las formas nuevas. */
  shape?: 'pill' | 'firme'
}

export function ProgressBar({ percent, color, className = '', shape = 'pill' }: ProgressBarProps) {
  const radius = shape === 'firme' ? 'rounded-[6px]' : 'rounded-full'
  const innerRadius = shape === 'firme' ? 'rounded-[5px]' : 'rounded-full'
  const clamped = Math.min(100, Math.max(0, percent))
  const fill = color ?? 'linear-gradient(90deg, var(--color-primary), var(--color-rose))'

  return (
    <div className={`w-full h-2 ${radius} bg-surface-2 border border-border overflow-hidden ${className}`}>
      <div
        className={`h-full ${innerRadius} transition-all`}
        style={{ width: `${clamped}%`, background: fill }}
      />
    </div>
  )
}
