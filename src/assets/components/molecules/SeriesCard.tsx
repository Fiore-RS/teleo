import { Heart, ImageOff } from 'lucide-react'
import { DogEar } from '../atoms/DogEar'
import { CoverImage } from '../atoms/CoverImage'
import type { ReadingStatus } from '../../../lib/status'

interface SeriesCardProps {
  title: string
  author?: string
  covers?: [string?, string?, string?]
  bookCount: number
  status: ReadingStatus
  isFavorite?: boolean
  onClick?: () => void
}

const placeholderBg = [
  'var(--color-accent-finished)',
  'var(--color-accent-reading)',
  'var(--color-accent-wishlist)',
]

function CoverBadges({ status, isFavorite }: { status: ReadingStatus; isFavorite?: boolean }) {
  return (
    <>
      <DogEar status={status} size={28} className="absolute top-0 right-0" />
      {isFavorite && (
        <span className="absolute bottom-1.5 left-1.5 w-6 h-6 rounded-full bg-surface flex items-center justify-center shadow-sm">
          <Heart size={12} fill="var(--color-accent-wishlist)" color="var(--color-accent-wishlist)" />
        </span>
      )}
    </>
  )
}

export function SeriesCard({
  title, author, covers = [], bookCount, status, isFavorite = false, onClick,
}: SeriesCardProps) {
  const [cover1, cover2, cover3] = covers

  return (
    <button onClick={onClick} className="text-left w-full">
      {bookCount === 0 ? (
        <div className="relative aspect-4/5 w-full rounded-xl overflow-hidden drop-shadow-md flex items-center justify-center" style={{ backgroundColor: placeholderBg[0] }}>
          <ImageOff size={22} className="text-surface" />
        </div>
      ) : bookCount === 1 ? (
        <div className="relative aspect-4/5 w-full rounded-xl overflow-hidden drop-shadow-md" style={{ backgroundColor: placeholderBg[0] }}>
          {cover1 && <CoverImage src={cover1} alt={title} className="w-full h-full object-cover" />}
          <CoverBadges status={status} isFavorite={isFavorite} />
        </div>
      ) : (
        <div className="relative flex aspect-4/5 w-full drop-shadow-md">
          {bookCount >= 3 && (
            <div className="relative w-3 h-[92%] mt-[8%] rounded-t-md rounded-l-md overflow-hidden shrink-0" style={{ backgroundColor: placeholderBg[2] }}>
              {cover3 && <CoverImage src={cover3} alt="" className="w-full h-full object-cover" />}
              <div className="absolute inset-y-0 right-0 w-1/2 bg-linear-to-r from-transparent to-black/25" />
            </div>
          )}
          <div
            className={`relative w-5 h-[96%] mt-[4%] rounded-t-md rounded-l-md overflow-hidden shrink-0 ${bookCount >= 3 ? '-ml-1' : ''}`}
            style={{ backgroundColor: placeholderBg[1] }}
          >
            {cover2 && <CoverImage src={cover2} alt="" className="w-full h-full object-cover" />}
            <div className="absolute inset-y-0 right-0 w-1/2 bg-linear-to-r from-transparent to-black/20" />
          </div>
          <div className="relative flex-1 h-full -ml-2 rounded-xl overflow-hidden" style={{ backgroundColor: placeholderBg[0] }}>
            {cover1 && <CoverImage src={cover1} alt={title} className="w-full h-full object-cover" />}
            <CoverBadges status={status} isFavorite={isFavorite} />
          </div>
        </div>
      )}

      <p className="mt-2 text-body-md font-body text-text line-clamp-2">{title}</p>
      {author && <p className="text-body-sm font-body text-text-secondary line-clamp-1">{author}</p>}
    </button>
  )
}