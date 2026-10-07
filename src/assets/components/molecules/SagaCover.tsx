import { ImageOff } from 'lucide-react'
import { DogEar } from '../atoms/DogEar'
import { CoverImage } from '../atoms/CoverImage'
import { FavoriteBadge } from './BookCover'
import type { ReadingStatus } from '../../../lib/status'

interface SagaCoverProps {
  title: string
  covers?: [string?, string?, string?]
  bookCount: number
  status: ReadingStatus
  isFavorite?: boolean
}

const placeholderBg = ['var(--color-magenta)', 'var(--color-orange)', 'var(--color-primary)']

function CoverBadges({ status, isFavorite }: { status: ReadingStatus; isFavorite?: boolean }) {
  return (
    <>
      <DogEar status={status} size={24} className="absolute top-0 right-0" />
      {isFavorite && <FavoriteBadge />}
    </>
  )
}

/** Pila de portadas de una saga para la repisa de Estante (V.3.0.0): la del primer libro
 *  al frente y, detrás, los lomos de los dos siguientes. Solo la imagen; el título y el
 *  autor van debajo del tablón (sin avance de la saga). */
export function SagaCover({ title, covers = [], bookCount, status, isFavorite = false }: SagaCoverProps) {
  const [cover1, cover2, cover3] = covers

  if (bookCount === 0) {
    return (
      <div
        className="relative aspect-4/5 w-full rounded-[9px] overflow-hidden drop-shadow-[0_6px_8px_rgba(0,0,0,0.35)] flex items-center justify-center"
        style={{ backgroundColor: placeholderBg[0] }}
      >
        <ImageOff size={22} className="text-surface" />
      </div>
    )
  }

  if (bookCount === 1) {
    return (
      <div
        className="relative aspect-4/5 w-full rounded-[9px] overflow-hidden drop-shadow-[0_6px_8px_rgba(0,0,0,0.35)]"
        style={{ backgroundColor: placeholderBg[0] }}
      >
        {cover1 && <CoverImage src={cover1} alt={title} className="w-full h-full object-cover" />}
        <CoverBadges status={status} isFavorite={isFavorite} />
      </div>
    )
  }

  return (
    <div className="relative flex items-end aspect-4/5 w-full drop-shadow-[0_6px_8px_rgba(0,0,0,0.35)]">
      {bookCount >= 3 && (
        <div className="relative w-2.5 h-[90%] rounded-l-md overflow-hidden shrink-0" style={{ backgroundColor: placeholderBg[2] }}>
          {cover3 && <CoverImage src={cover3} alt="" className="w-full h-full object-cover" />}
          <div className="absolute inset-y-0 right-0 w-1/2 bg-linear-to-r from-transparent to-black/30" />
        </div>
      )}
      <div
        className={`relative w-4 h-[95%] rounded-l-md overflow-hidden shrink-0 ${bookCount >= 3 ? '-ml-1' : ''}`}
        style={{ backgroundColor: placeholderBg[1] }}
      >
        {cover2 && <CoverImage src={cover2} alt="" className="w-full h-full object-cover" />}
        <div className="absolute inset-y-0 right-0 w-1/2 bg-linear-to-r from-transparent to-black/25" />
      </div>
      <div className="relative flex-1 h-full -ml-2 rounded-[9px] overflow-hidden" style={{ backgroundColor: placeholderBg[0] }}>
        {cover1 && <CoverImage src={cover1} alt={title} className="w-full h-full object-cover" />}
        <CoverBadges status={status} isFavorite={isFavorite} />
      </div>
    </div>
  )
}
