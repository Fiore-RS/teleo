import { Heart } from 'lucide-react'
import { DogEar } from '../atoms/DogEar'
import type { ReadingStatus } from '../../../lib/status'

interface SeriesCardProps {
  title: string
  author?: string
  covers?: [string?, string?, string?]
  status: ReadingStatus
  isFavorite?: boolean
  onClick?: () => void
}

const placeholderBg = [
  'var(--color-accent-finished)',
  'var(--color-accent-reading)',
  'var(--color-accent-wishlist)',
]

export function SeriesCard({
  title,
  author,
  covers = [],
  status,
  isFavorite = false,
  onClick,
}: SeriesCardProps) {
  const [cover1, cover2, cover3] = covers

  return (
    <button onClick={onClick} className="text-left w-full">
      <div className="relative flex aspect-4/5 w-full drop-shadow-md">
        {/* libro 3: mas atras */}
        <div
          className="relative w-6 h-[92%] mt-[8%] rounded-t-md rounded-l-md overflow-hidden shrink-0"
          style={{ backgroundColor: placeholderBg[2] }}
        >
          {cover3 && <img src={cover3} alt="" className="w-full h-full object-cover" />}
          <div className="absolute inset-y-0 right-0 w-1/2 bg-linear-to-r from-transparent to-black/25" />
        </div>

        {/* libro 2: intermedio */}
        <div
          className="relative w-7 h-[96%] mt-[4%] rounded-t-md rounded-l-md overflow-hidden shrink-0 -ml-1"
          style={{ backgroundColor: placeholderBg[1] }}
        >
          {cover2 && <img src={cover2} alt="" className="w-full h-full object-cover" />}
          <div className="absolute inset-y-0 right-0 w-1/2 bg-linear-to-r from-transparent to-black/20" />
        </div>

        {/* libro 1: al frente */}
        <div
          className="relative flex-1 h-full -ml-2 rounded-xl overflow-hidden"
          style={{ backgroundColor: placeholderBg[0] }}
        >
          {cover1 && <img src={cover1} alt={title} className="w-full h-full object-cover" />}

          <DogEar status={status} size={36} className="absolute top-0 right-0" />

          {isFavorite && (
            <span className="absolute bottom-2 left-2 w-7 h-7 rounded-full bg-surface flex items-center justify-center shadow-sm">
              <Heart
                size={14}
                fill="var(--color-accent-wishlist)"
                color="var(--color-accent-wishlist)"
              />
            </span>
          )}
        </div>
      </div>

      <p className="mt-2 text-body-md font-body text-text line-clamp-2">{title}</p>
      {author && (
        <p className="text-body-sm font-body text-text-secondary line-clamp-1">{author}</p>
      )}
    </button>
  )
}