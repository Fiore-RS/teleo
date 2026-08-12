import { ImageOff } from 'lucide-react'
import { DogEar } from '../atoms/DogEar'
import { ProgressBar } from '../atoms/ProgressBar'
import { Button } from '../atoms/Button'

interface BookCardReadingProps {
  title: string
  author?: string
  coverUrl?: string
  progressPercent: number
  progressLabel?: string
  onUpdateClick: () => void
}

export function BookCardReading({
  title,
  author,
  coverUrl,
  progressPercent,
  progressLabel,
  onUpdateClick,
}: BookCardReadingProps) {
  return (
    <div className="flex gap-3 bg-surface rounded-2xl p-3 border border-border">
      <div className="relative w-20 shrink-0 aspect-2/3 rounded-xl overflow-hidden bg-border">
        {coverUrl ? (
          <img src={coverUrl} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageOff size={22} strokeWidth={1.5} className="text-text-secondary" />
          </div>
        )}
        <DogEar status="leyendo" size={28} className="absolute top-0 right-0" />
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <p className="text-body-md font-body text-text line-clamp-2">{title}</p>
          {author && (
            <p className="text-body-sm font-body text-text-secondary line-clamp-1 mt-0.5">
              {author}
            </p>
          )}
        </div>

        <div className="mt-2">
          <div className="flex items-center justify-between text-body-sm font-body text-text-secondary mb-1">
            {progressLabel && <span>{progressLabel}</span>}
            <span className="ml-auto">{Math.round(progressPercent)}%</span>
          </div>
          <ProgressBar percent={progressPercent} />
          <Button variant="primary" onClick={onUpdateClick} className="mt-2 py-2! text-body-md!">
            Actualizar
          </Button>
        </div>
      </div>
    </div>
  )
}