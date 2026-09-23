import { ImageOff } from 'lucide-react'
import { DogEar } from '../atoms/DogEar'
import { Button } from '../atoms/Button'
import { CoverImage } from '../atoms/CoverImage'

interface BookCardPriorityProps {
  title: string
  author?: string
  coverUrl?: string
  /** Posición en la lista (1, 2, 3...). Se muestra como un numerito sobre la portada. */
  position?: number
  onStartReading: () => void
}

/** Libro de "Mi lista de esta temporada" en Mesa: portada arriba, datos del libro y botón de
 *  acción abajo. Rediseño 2026: sin tarjeta propia (la tarjeta contenedora la pone Mesa), con
 *  el número de prioridad sobre la portada y el botón siempre alineado abajo. */
export function BookCardPriority({ title, author, coverUrl, position, onStartReading }: BookCardPriorityProps) {
  return (
    <div className="h-full flex flex-col gap-1.5">
      <div className="relative aspect-2/3 w-full rounded-[10px] overflow-hidden bg-surface-2 shadow-[0_6px_14px_-8px_rgba(60,30,10,0.5)]">
        {coverUrl ? (
          <CoverImage src={coverUrl} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageOff size={18} strokeWidth={1.5} className="text-text-secondary" />
          </div>
        )}
        {position !== undefined && (
          <span className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-magenta text-on-accent text-[11px] font-bold flex items-center justify-center">
            {position}
          </span>
        )}
        <DogEar status="pendiente" size={24} className="absolute top-0 right-0" />
      </div>

      <p className="text-body-md font-semibold text-text leading-tight line-clamp-2 min-h-[2.5em] mt-0.5">{title}</p>
      {author && <p className="text-body-sm text-text-secondary truncate">{author}</p>}

      <Button variant="soft" size="sm" onClick={onStartReading} className="mt-auto px-2!">
        Empezar
      </Button>
    </div>
  )
}
