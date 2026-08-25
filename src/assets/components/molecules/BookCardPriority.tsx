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

/** Card de "Mi lista de esta temporada" en Mesa — mismo layout horizontal que
 *  `BookCardReading`, pero para libros que todavía no se empiezan a leer: en vez de barra de
 *  progreso, un botón directo para pasarlos a "leyendo". */
export function BookCardPriority({ title, author, coverUrl, onStartReading }: BookCardPriorityProps) {
  return (
    <div className="flex gap-3 bg-surface rounded-2xl p-3 border border-border">
      <div className="relative w-20 shrink-0 aspect-2/3 rounded-xl overflow-hidden bg-border">
        {coverUrl ? (
          <CoverImage src={coverUrl} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageOff size={22} strokeWidth={1.5} className="text-text-secondary" />
          </div>
        )}
        <DogEar status="pendiente" size={28} className="absolute top-0 right-0" />
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

        <Button variant="green" onClick={onStartReading} className="mt-2 py-2! text-body-md!">
          Empezar a leer
        </Button>
      </div>
    </div>
  )
}
