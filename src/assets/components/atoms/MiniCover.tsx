import { ImageOff } from 'lucide-react'
import { CoverImage } from './CoverImage'

interface MiniCoverProps {
  src: string | null | undefined
  title: string
  /** Ancho (ej. "w-10"); el alto sale de la proporción 2:3. */
  className?: string
}

/** Portada chica para listas (Compras, Resumen): proporción de libro, esquinas suaves y un
 *  ícono si el libro no tiene portada. */
export function MiniCover({ src, title, className = 'w-10' }: MiniCoverProps) {
  return (
    <span className={`relative block shrink-0 aspect-2/3 rounded-md overflow-hidden bg-surface-2 border border-border ${className}`}>
      {src ? (
        <CoverImage src={src} alt={title} className="w-full h-full object-cover" />
      ) : (
        <span className="w-full h-full flex items-center justify-center" aria-label={title}>
          <ImageOff size={14} className="text-text-muted" />
        </span>
      )}
    </span>
  )
}
