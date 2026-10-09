import { ImageOff, type LucideIcon } from 'lucide-react'
import { HorizontalScroller } from '../atoms/HorizontalScroller'
import { DogEar } from '../atoms/DogEar'
import { CoverImage } from '../atoms/CoverImage'
import { CoverSkeleton } from '../atoms/Skeleton'
import { Card, CardAction, type CardTone } from './Card'
import type { Database } from '../../../types/database'
import type { ReadingStatus } from '../../../lib/status'

type Book = Pick<Database['public']['Tables']['books']['Row'], 'id' | 'title' | 'cover_url' | 'status'>

interface ProfileBookShelfProps {
  title: string
  books: Book[]
  /** Primera carga: siluetas de portada en vez de "Nada por aquí todavía". */
  isLoading?: boolean
  icon?: LucideIcon
  /** Color de la etiqueta. Por defecto el vino de marca. */
  tone?: CardTone
  onBookClick?: (bookId: string) => void
  onSeeAll?: () => void
}

/** Fila de portadas de Perfil (Leyendo ahora, Favoritos, etc.). V.3.0.0: cada fila es una
 *  tarjeta con pestaña de separador y "Ver todos ›" a la altura de la pestaña; las
 *  portadas llegan hasta los bordes de la tarjeta al desplazarse. */
export function ProfileBookShelf({ title, books, isLoading = false, icon, tone, onBookClick, onSeeAll }: ProfileBookShelfProps) {
  const coverClasses =
    'relative w-24 shrink-0 aspect-2/3 rounded-[10px] overflow-hidden bg-surface-2 shadow-[0_6px_14px_-8px_rgba(60,30,10,0.5)]'

  return (
    <Card
      tab={{ label: title, icon }}
      tone={tone}
      action={onSeeAll && books.length > 0 ? <CardAction onClick={onSeeAll}>Ver todos</CardAction> : undefined}
    >
      {isLoading ? (
        <div className="flex gap-3 -mx-[18px] px-[18px] overflow-hidden pb-1" aria-label="Cargando">
          {[0, 1, 2, 3, 4].map((i) => (
            <CoverSkeleton key={i} className="w-24 shrink-0" />
          ))}
        </div>
      ) : books.length === 0 ? (
        <p className="text-body-md text-text-secondary">Nada por aquí todavía.</p>
      ) : (
        <HorizontalScroller className="-mx-[18px] px-[18px] gap-3! pb-1 stagger-children">
          {books.map((book) => {
            const cover = (
              <>
                {book.cover_url ? (
                  <CoverImage src={book.cover_url ?? undefined} alt={book.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageOff size={16} className="text-text-secondary" />
                  </div>
                )}
                <DogEar status={book.status as ReadingStatus} size={24} className="absolute top-0 right-0" />
              </>
            )
            return onBookClick ? (
              <button
                key={book.id}
                onClick={() => onBookClick(book.id)}
                aria-label={book.title}
                className={`${coverClasses} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-text`}
              >
                {cover}
              </button>
            ) : (
              <div key={book.id} className={coverClasses}>
                {cover}
              </div>
            )
          })}
        </HorizontalScroller>
      )}
    </Card>
  )
}
