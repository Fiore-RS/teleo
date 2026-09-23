import { Heart, ImageOff } from 'lucide-react'
import { DogEar } from '../atoms/DogEar'
import { CoverImage } from '../atoms/CoverImage'
import type { ReadingStatus } from '../../../lib/status'

interface BookCardProps {
  title: string
  author?: string
  coverUrl?: string
  status: ReadingStatus
  isFavorite?: boolean
  onClick?: () => void
}

export function BookCard({
  title,
  author,
  coverUrl,
  status,
  isFavorite = false,
  onClick,
}: BookCardProps) {
  return (
    <button onClick={onClick} className="text-left w-full rounded-[10px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-text">
      <div className="relative aspect-2/3 w-full rounded-[10px] overflow-hidden bg-surface-2 shadow-[0_6px_14px_-8px_rgba(60,30,10,0.5)]">
        {coverUrl ? (
          <CoverImage src={coverUrl} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageOff size={28} strokeWidth={1.5} className="text-text-secondary" />
          </div>
        )}

        <DogEar status={status} size={28} className="absolute top-0 right-0" />

        {isFavorite && (
          <span className="absolute bottom-1.5 left-1.5 w-6 h-6 rounded-full bg-surface/95 flex items-center justify-center shadow-sm">
            <Heart size={12} fill="var(--color-primary)" color="var(--color-primary)" />
          </span>
        )}
      </div>

      <div className="mt-2 h-[56px]">
        <p className="text-body-md font-body font-semibold leading-tight text-text line-clamp-2">{title}</p>
        <p className="text-body-sm font-body text-text-secondary line-clamp-1 mt-0.5">{author || ' '}</p>
      </div>
    </button>
  )
}