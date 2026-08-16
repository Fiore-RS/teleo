import type { MouseEvent } from 'react'
import { RatingIcon, type RatingShape, type RatingState } from '../atoms/RatingIcon'

interface RatingRowProps {
  value: number
  shape: RatingShape
  color: string
  size?: number
  label?: string
  onRate?: (value: number) => void
  className?: string
}

export function RatingRow({ value, shape, color, size = 22, label, onRate, className = '' }: RatingRowProps) {
  const states: RatingState[] = Array.from({ length: 5 }, (_, i) => {
    const position = i + 1
    if (value >= position) return 'full'
    if (value >= position - 0.5) return 'half'
    return 'empty'
  })

  function handleClick(e: MouseEvent<HTMLButtonElement>, position: number) {
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const isLeftHalf = clickX < rect.width / 2
    onRate?.(isLeftHalf ? position - 0.5 : position)
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {label && <span className="text-body-lg font-body text-text w-28 shrink-0 truncate">{label}</span>}
      <div className="flex gap-1">
        {states.map((state, i) =>
          onRate ? (
            <button key={i} type="button" onClick={(e) => handleClick(e, i + 1)} className="p-0.5">
              <RatingIcon shape={shape} state={state} color={color} size={size} />
            </button>
          ) : (
            <RatingIcon key={i} shape={shape} state={state} color={color} size={size} />
          )
        )}
      </div>
    </div>
  )
}