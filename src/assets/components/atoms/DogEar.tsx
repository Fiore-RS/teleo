export type DogEarStatus = 'leyendo' | 'pendiente' | 'terminado' | 'abandonado' | 'deseado'

import { statusColorVar, type ReadingStatus } from '../../../lib/status'

interface DogEarProps {
  status: ReadingStatus
  size?: number
  className?: string
}

interface DogEarProps {
  status: DogEarStatus
  size?: number
  className?: string
}

export function DogEar({ status, size = 40, className = '' }: DogEarProps) {
  const accent = statusColorVar[status]
  const r = 22 // radio de la esquina superior derecha (ajustable)

  // Cuadrado con esquinas rectas, excepto la superior derecha (redondeada)
  const outerPath = `
    M 0,0
    L ${100 - r},0
    Q 100,0 100,${r}
    L 100,100
    L 0,100
    Z
  `

  const clipId = `dogear-clip-${status}-${size}`

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <clipPath id={clipId}>
          <path d={outerPath} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        {/* izquierda: crema */}
        <polygon points="0,0 50,50 0,100" fill="var(--color-surface)" />
        {/* abajo: gris neutro */}
        <polygon points="0,100 50,50 100,100" fill="var(--color-border)" />
        {/* arriba: color principal del estado */}
        <polygon points="0,0 100,0 50,50" fill={accent} />
        {/* derecha: mismo color, oscurecido (sombra del doblez) */}
        <polygon
          points="100,0 100,100 50,50"
          fill={accent}
          style={{ filter: 'brightness(0.72)' }}
        />
      </g>
    </svg>
  )
}