import { RatingIcon, type RatingShape, type RatingState } from '../atoms/RatingIcon'

interface RatingRowProps {
  value: number
  shape: RatingShape
  color: string
  size?: number
  label?: string
  onRate?: (value: number) => void
}

export function RatingRow({ value, shape, color, size = 22, label, onRate }: RatingRowProps) {
  const states: RatingState[] = Array.from({ length: 5 }, (_, i) => {
    const position = i + 1
    if (value >= position) return 'full'
    if (value >= position - 0.5) return 'half'
    return 'empty'
  })

  return (
    <div className="flex items-center gap-3">
      {label && <span className="text-body-lg font-body text-text w-28 shrink-0 truncate">{label}</span>}
      <div className="flex gap-1">
        {states.map((state, i) =>
          onRate ? (
            <button key={i} type="button" onClick={() => onRate(i + 1)} className="p-0.5">
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