import { Heart, ImageOff } from 'lucide-react'
import { DogEar } from '../atoms/DogEar'
import { CoverImage } from '../atoms/CoverImage'
import type { ReadingStatus } from '../../../lib/status'

interface BookCoverProps {
  title: string
  coverUrl?: string
  status: ReadingStatus
  isFavorite?: boolean
  /** Portada más chica (estante de 4 columnas): doblez y corazón más pequeños. */
  small?: boolean
}

/** Corazón de favorito abajo a la izquierda de la portada. */
export function FavoriteBadge({ small = false }: { small?: boolean }) {
  return (
    <span
      className={`absolute rounded-full bg-surface/95 flex items-center justify-center shadow-sm ${
        small ? 'bottom-1 left-1 w-5 h-5' : 'bottom-1.5 left-1.5 w-6 h-6'
      }`}
    >
      <Heart size={small ? 10 : 12} fill="var(--color-primary)" color="var(--color-primary)" />
    </span>
  )
}

/** Portada de un libro para la repisa de Estante (V.3.0.0), con el doblez de página por
 *  estado y el corazón de favorito. Solo la imagen: el título y el autor los pone la repisa
 *  debajo del tablón, y el botón también. */
export function BookCover({ title, coverUrl, status, isFavorite = false, small = false }: BookCoverProps) {
  return (
    <div className="relative aspect-2/3 w-full rounded-[9px] overflow-hidden bg-surface-2 shadow-[0_6px_14px_-8px_rgba(0,0,0,0.55)]">
      {coverUrl ? (
        <CoverImage src={coverUrl} alt={title} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <ImageOff size={small ? 22 : 28} strokeWidth={1.5} className="text-text-secondary" />
        </div>
      )}
      <DogEar status={status} size={small ? 18 : 24} className="absolute top-0 right-0" />
      {isFavorite && <FavoriteBadge small={small} />}
    </div>
  )
}
