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
    <button onClick={onClick} className="text-left w-full">
      <div className="relative aspect-2/3 w-full rounded-xl overflow-hidden bg-border">
        {coverUrl ? (
          <CoverImage src={coverUrl} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageOff size={28} strokeWidth={1.5} className="text-text-secondary" />
          </div>
        )}

        <DogEar status={status} size={28} className="absolute top-0 right-0" />

        {isFavorite && (
          <span className="absolute bottom-1.5 left-1.5 w-6 h-6 rounded-full bg-surface flex items-center justify-center shadow-sm">
            <Heart size={12} fill="var(--color-accent-wishlist)" color="var(--color-accent-wishlist)" />
          </span>
        )}
      </div>

      <p className="mt-2 text-body-md font-body text-text line-clamp-2">{title}</p>
      {author && (
        <p className="text-body-sm font-body text-text-secondary line-clamp-1">{author}</p>
      )}
    </button>
  )
}