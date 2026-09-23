interface SparkleProps {
  size?: number
  className?: string
}

/** Destello de cuatro puntas, el ornamento del rediseño. Toma el color de `currentColor`
 *  (por defecto se usa con `text-ornament`). */
export function Sparkle({ size = 12, className = '' }: SparkleProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 0l2.4 9.6L24 12l-9.6 2.4L12 24l-2.4-9.6L0 12l9.6-2.4z" />
    </svg>
  )
}
