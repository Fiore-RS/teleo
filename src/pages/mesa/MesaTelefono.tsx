import type { ReactNode } from 'react'
import { ImageOff, TriangleAlert } from 'lucide-react'
import type { Database } from '../../types/database'
import { CoverImage } from '../../assets/components/atoms/CoverImage'
import { Skeleton, CoverSkeleton } from '../../assets/components/atoms/Skeleton'
import { Button } from '../../assets/components/atoms/Button'
import { getProgressInfo } from '../../lib/progress'
import { getReadingPace, paceSentence } from '../../lib/readingPace'
import { ON_PAPER } from './MesaAncha'
import { progressDetail, shortDate } from './libroEnCurso'

type Book = Database['public']['Tables']['books']['Row']

/** Tamaño de la esquina doblada (arriba a la derecha), como la hoja de las pantallas grandes. */
const FOLD = 24
const FOLD_CLIP = `polygon(0 0, calc(100% - ${FOLD}px) 0, 100% ${FOLD}px, 100% 100%, 0 100%)`
/** Renglones de la hoja, un poco más juntos que en las pantallas grandes. */
const LINES =
  'repeating-linear-gradient(180deg, transparent 0 27px, color-mix(in srgb, var(--color-border) 75%, transparent) 27px 28px)'

/** La hoja de cuaderno del celular (V.4.5.0): papel con renglones, margen rojo y la esquina
 *  doblada, como la página derecha del libro abierto de las pantallas grandes. */
function Hoja({ children, label }: { children: ReactNode; label: string }) {
  return (
    // La sombra va en un envoltorio: el recorte de la esquina doblada se la comería.
    <section aria-label={label} className="relative drop-shadow-[0_18px_22px_var(--teleo-cover-shadow)]">
      <div
        className="relative bg-surface rounded-md overflow-hidden pl-10 pr-4.5 pt-5 pb-5"
        style={{ clipPath: FOLD_CLIP, backgroundImage: LINES, backgroundPosition: '0 6px' }}
      >
        {/* Margen rojo del cuaderno, de arriba abajo. */}
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-6 w-[1.5px] pointer-events-none"
          style={{ backgroundColor: 'color-mix(in srgb, var(--color-rose) 60%, transparent)' }}
        />
        {/* Esquina doblada. */}
        <span
          aria-hidden="true"
          className="absolute top-0 right-0"
          style={{
            width: FOLD,
            height: FOLD,
            background: 'linear-gradient(225deg, transparent 50%, var(--color-surface-2) 50%)',
            boxShadow: '-2px 2px 4px -2px rgba(0,0,0,0.25)',
          }}
        />
        <div className="relative">{children}</div>
      </div>
    </section>
  )
}

interface HojaLeyendoProps {
  /** El libro que se avanzó por última vez (el mismo que va abierto en las pantallas grandes). */
  book: Book | undefined
  isLoading: boolean
  onUpdate: () => void
  onOpen: () => void
  onRandom: () => void
  onPending: () => void
}

/** "Leyendo ahora" en el celular (V.4.5.0): el último libro avanzado en una hoja de cuaderno,
 *  con la portada, el porcentaje grande y la barra. Los demás libros en curso van debajo como
 *  lomos ("También en tu mesa"). */
export function HojaLeyendo({ book, isLoading, onUpdate, onOpen, onRandom, onPending }: HojaLeyendoProps) {
  if (isLoading) {
    return (
      <Hoja label="Leyendo ahora">
        <div aria-label="Cargando">
          <Skeleton className="h-3 w-1/3 rounded-full" />
          <div className="flex gap-3.5 mt-3">
            <CoverSkeleton className="w-24 shrink-0" />
            <div className="flex-1 pt-1">
              <Skeleton className="h-6 w-4/5 rounded-full" />
              <Skeleton className="h-4 w-1/2 mt-2.5 rounded-full" />
            </div>
          </div>
          <Skeleton className="h-2.5 w-full mt-6 rounded-full" />
          <Skeleton className="h-11 w-full mt-5 rounded-[10px]" />
        </div>
      </Hoja>
    )
  }

  if (!book) {
    return (
      <Hoja label="Leyendo ahora">
        <h2 className="smallcaps text-primary-text">Leyendo ahora</h2>
        <p className="mt-3 font-title text-[26px] leading-[1.05] text-text">Tu mesa está libre</p>
        <p className="mt-2 font-display italic text-body-lg text-text-secondary">Elige qué leer y aparecerá aquí.</p>
        <div className="flex flex-col gap-2.5 mt-5">
          <Button size="sm" onClick={onRandom} className="h-11">
            Elegir un pendiente al azar
          </Button>
          <Button size="sm" variant="outline" onClick={onPending} className={`h-11 ${ON_PAPER}`}>
            Ver mis pendientes
          </Button>
        </div>
      </Hoja>
    )
  }

  const { percent } = getProgressInfo(book)
  const detail = progressDetail(book)
  const pace = getReadingPace(book)
  return (
    <Hoja label="Leyendo ahora">
      <h2 className="smallcaps text-primary-text">Leyendo ahora</h2>
      <div className="flex gap-3.5 mt-3">
        <button
          type="button"
          onClick={onOpen}
          aria-label={`Ver detalles de ${book.title}`}
          className="relative w-24 shrink-0 self-start aspect-2/3 rounded-[3px_6px_6px_3px] overflow-hidden bg-surface-2 shadow-[0_1px_1.5px_rgba(0,0,0,0.2),0_10px_18px_-8px_rgba(0,0,0,0.5)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-text"
        >
          {book.cover_url ? (
            <CoverImage src={book.cover_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="w-full h-full flex items-center justify-center">
              <ImageOff size={22} strokeWidth={1.5} className="text-text-secondary" />
            </span>
          )}
          {!book.start_date && (
            <span className="absolute top-1 left-1 w-6 h-6 rounded-full bg-orange flex items-center justify-center shadow-sm" title="Sin fecha de inicio">
              <TriangleAlert size={14} className="text-surface" />
            </span>
          )}
        </button>
        <div className="min-w-0 flex flex-col">
          <button
            type="button"
            onClick={onOpen}
            className="text-left font-title text-[23px] leading-[1.08] text-text rounded-sm focus-visible:outline-2 focus-visible:outline-primary-text"
          >
            <span className="line-clamp-3">{book.title}</span>
          </button>
          {book.author && <p className="mt-1.5 font-display italic text-body-md text-text-secondary line-clamp-2">{book.author}</p>}
          {book.start_date && <p className="mt-auto pt-2 text-body-sm text-text-secondary">Leyendo desde el {shortDate(book.start_date)}</p>}
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-3 mt-4">
        {/* Al cambiar el progreso, el número aparece con un fundido. */}
        <p key={Math.round(percent)} className="font-title text-[38px] leading-none text-text tabular-nums animate-fade-in">
          {Math.round(percent)}
          <span className="text-[21px]">%</span>
        </p>
        {detail && <p className="text-body-sm font-semibold text-text-secondary text-right">{detail}</p>}
      </div>
      <div
        role="progressbar"
        aria-label={`Progreso de ${book.title}`}
        aria-valuenow={Math.round(percent)}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2.5 rounded-[5px] bg-reading-soft mt-2.5 overflow-hidden"
      >
        <div className="h-full rounded-[5px] bg-accent-reading transition-all motion-reduce:transition-none" style={{ width: `${Math.min(100, percent)}%` }} />
      </div>
      {pace && <p className="mt-2 text-body-sm text-text-secondary">{paceSentence(pace)}</p>}

      <div className="grid grid-cols-[3fr_2fr] gap-2 mt-4.5">
        <Button size="sm" onClick={onUpdate} className="h-11 px-2">
          Actualizar progreso
        </Button>
        <Button size="sm" variant="outline" onClick={onOpen} className={`h-11 px-2 ${ON_PAPER}`}>
          Ver detalles
        </Button>
      </div>
    </Hoja>
  )
}
