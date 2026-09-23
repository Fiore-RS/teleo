import { ImageOff, TriangleAlert } from 'lucide-react'
import { DogEar } from '../atoms/DogEar'
import { ProgressBar } from '../atoms/ProgressBar'
import { Button } from '../atoms/Button'
import { CoverImage } from '../atoms/CoverImage'

interface BookCardReadingProps {
  title: string
  author?: string
  coverUrl?: string
  progressPercent: number
  progressLabel?: string
  /** true cuando el libro está "leyendo" pero no tiene fecha de inicio — muestra un ícono de
   *  advertencia en la esquina de la portada para llamar la atención. */
  missingStartDate?: boolean
  onUpdateClick: () => void
}

/** Libro en progreso dentro de la tarjeta "Leyendo ahora" de Mesa. Rediseño 2026: ya no es
 *  una tarjeta propia sino una fila; la tarjeta contenedora la pone Mesa y las filas se
 *  separan con una línea punteada. */
export function BookCardReading({
  title,
  author,
  coverUrl,
  progressPercent,
  progressLabel,
  missingStartDate = false,
  onUpdateClick,
}: BookCardReadingProps) {
  return (
    <article className="flex gap-3.5">
      <div className="relative w-26 shrink-0 aspect-2/3 rounded-[10px] overflow-hidden bg-surface-2 shadow-[0_6px_14px_-8px_rgba(60,30,10,0.5)]">
        {coverUrl ? (
          <CoverImage src={coverUrl} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageOff size={22} strokeWidth={1.5} className="text-text-secondary" />
          </div>
        )}
        <DogEar status="leyendo" size={26} className="absolute top-0 right-0" />
        {missingStartDate && (
          <span
            className="absolute top-1 left-1 w-6 h-6 rounded-full bg-orange flex items-center justify-center shadow-sm"
            title="Sin fecha de inicio"
          >
            <TriangleAlert size={14} className="text-surface" />
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-between gap-2.5">
        <div>
          <h3 className="font-display font-semibold text-[17px] leading-tight text-text line-clamp-2">
            {title}
          </h3>
          {author && (
            <p className="text-body-md font-body text-text-secondary line-clamp-1 mt-0.5">{author}</p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between text-body-sm font-body text-text-secondary mb-1.5 tabular-nums">
            {progressLabel && <span>{progressLabel}</span>}
            <span key={Math.round(progressPercent)} className="ml-auto animate-fade-in">{Math.round(progressPercent)}%</span>
          </div>
          <ProgressBar percent={progressPercent} />
          <Button variant="soft" size="sm" onClick={onUpdateClick} className="mt-2.5">
            Actualizar
          </Button>
        </div>
      </div>
    </article>
  )
}
