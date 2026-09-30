import { ImageOff } from 'lucide-react'
import { CoverImage } from '../atoms/CoverImage'

export interface MiniBook {
  title: string
  author?: string | null
  cover_url?: string | null
}

/** Mini ficha del libro (portada chica, título y autor) para las hojas cortas de cambio de
 *  estado: Terminar, Abandonar, Empezar a leer y Falta la fecha de inicio (V.2.2.0). */
export function BookMiniHeader({ book, className = '' }: { book: MiniBook; className?: string }) {
  return (
    <div className={`flex gap-3 items-center mb-4 ${className}`}>
      <div className="relative w-11 shrink-0 aspect-2/3 rounded-[7px] overflow-hidden bg-surface-2 shadow-[0_6px_14px_-8px_rgba(60,30,10,0.5)]">
        {book.cover_url ? (
          <CoverImage src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageOff size={13} className="text-text-secondary" />
          </div>
        )}
      </div>
      <div className="min-w-0">
        <p className="font-display font-semibold text-body-lg leading-tight text-text line-clamp-2">{book.title}</p>
        {book.author && <p className="text-body-md text-text-secondary mt-0.5 truncate">{book.author}</p>}
      </div>
    </div>
  )
}
