import { ImageOff } from 'lucide-react'
import { DogEar } from '../atoms/DogEar'
import { Button } from '../atoms/Button'
import { CoverImage } from '../atoms/CoverImage'

interface BookCardPriorityProps {
  title: string
  author?: string
  coverUrl?: string
  onStartReading: () => void
}

/** Card de "Mi lista de esta temporada" en Mesa — mismo layout vertical que las cards de
 *  reseña en Cuaderno (portada arriba, datos del libro, botón de acción abajo), a pedido de
 *  Fiorella en vez de la card horizontal ancha que se usaba antes (la misma de
 *  `BookCardReading`). Pensada para una grilla de varias columnas, no una lista vertical. */
export function BookCardPriority({ title, author, coverUrl, onStartReading }: BookCardPriorityProps) {
  return (
    <div className="bg-surface border border-border rounded-xl p-2.5 flex flex-col">
      <div className="relative aspect-2/3 w-full rounded-lg overflow-hidden bg-border">
        {coverUrl ? (
          <CoverImage src={coverUrl} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageOff size={18} strokeWidth={1.5} className="text-text-secondary" />
          </div>
        )}
        <DogEar status="pendiente" size={28} className="absolute top-0 right-0" />
      </div>

      <p className="text-body-sm text-text line-clamp-2 mt-1.5">{title}</p>
      {author && (
        <p className="text-body-sm text-text-secondary line-clamp-1 mt-0.5">{author}</p>
      )}

      <Button variant="green" onClick={onStartReading} className="mt-2 w-full py-2! text-body-sm!">
        Empezar a leer
      </Button>
    </div>
  )
}
