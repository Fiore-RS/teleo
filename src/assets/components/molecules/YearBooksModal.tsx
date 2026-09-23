import { ImageOff } from 'lucide-react'
import { CoverImage } from '../atoms/CoverImage'
import { Sheet } from '../atoms/Sheet'
import { Skeleton, CoverSkeleton } from '../atoms/Skeleton'
import { useYearInBooks } from '../../../hooks/useYearInBooks'
import { formatDuration } from '../../../lib/progress'

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

interface YearBooksModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string | undefined
  year: number | null
}

export function YearBooksModal({ isOpen, onClose, userId, year }: YearBooksModalProps) {
  const { data, isLoading } = useYearInBooks(userId, isOpen ? year : null)

  if (!isOpen || year === null) return null

  const stats = [
    { label: 'Libros', value: String(data.totalBooks) },
    { label: 'Páginas', value: data.totalPages.toLocaleString() },
    { label: 'Escuchado', value: formatDuration(data.totalAudioSeconds) },
  ]

  return (
    <Sheet onClose={onClose} title={`Libros leídos en ${year}`}>
      {isLoading ? (
        <div aria-label="Cargando">
          <div className="grid grid-cols-3 gap-2 mb-6">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-[68px] rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-3.5 w-1/3 rounded-full mb-3" />
          <div className="grid grid-cols-4 gap-2.5">
            {[0, 1, 2, 3].map((i) => (
              <CoverSkeleton key={i} />
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 mb-6">
            {stats.map((st) => (
              <div key={st.label} className="bg-surface-2 border border-border rounded-2xl px-2 py-3 text-center">
                <p className="font-display font-semibold text-[20px] leading-tight text-text tabular-nums">{st.value}</p>
                <p className="text-body-sm text-text-secondary mt-0.5">{st.label}</p>
              </div>
            ))}
          </div>

          {data.months.length === 0 ? (
            <p className="text-body-md text-text-secondary text-center">No hay libros terminados en {year}.</p>
          ) : (
            <div className="space-y-6 stagger-children">
              {data.months.map(({ month, books }) => (
                <section key={month}>
                  <h3 className="flex items-center gap-2 mb-3 font-body font-bold text-body-sm uppercase tracking-[0.14em] text-primary-text">
                    <span className="w-4 h-0.5 rounded-full bg-primary-text" aria-hidden="true" />
                    {MONTH_NAMES[month - 1]}
                    <span className="text-text-muted font-semibold tracking-normal">· {books.length}</span>
                  </h3>
                  <div className="grid grid-cols-4 gap-2.5">
                    {books.map((book) => (
                      <div
                        key={book.id}
                        className="aspect-2/3 rounded-lg overflow-hidden bg-surface-2 shadow-[0_6px_14px_-8px_rgba(60,30,10,0.5)]"
                        title={book.title}
                      >
                        {book.cover_url ? (
                          <CoverImage src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageOff size={16} className="text-text-secondary" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </>
      )}
    </Sheet>
  )
}
