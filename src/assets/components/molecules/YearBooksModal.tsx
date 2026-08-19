import { ImageOff } from 'lucide-react'
import { CoverImage } from '../atoms/CoverImage'
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

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6" onClick={onClose}>
      <div
        className="w-full max-w-sm bg-surface rounded-3xl p-6 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display italic text-display-md text-accent-wishlist">
            Libros leídos en {year}
          </h2>
          <button onClick={onClose} aria-label="Cerrar" className="text-text-secondary">✕</button>
        </div>

        {isLoading ? null : (
          <>
            <div className="grid grid-cols-3 gap-2 mb-6">
              <div className="bg-bg rounded-xl py-3 text-center">
                <p className="font-display text-display-md text-accent-wishlist">{data.totalBooks}</p>
                <p className="text-body-sm text-text-secondary">Libros</p>
              </div>
              <div className="bg-bg rounded-xl py-3 text-center">
                <p className="font-display text-display-md text-accent-wishlist">{data.totalPages.toLocaleString()}</p>
                <p className="text-body-sm text-text-secondary">Páginas</p>
              </div>
              <div className="bg-bg rounded-xl py-3 text-center">
                <p className="font-display text-display-md text-accent-wishlist">{formatDuration(data.totalAudioSeconds)}</p>
                <p className="text-body-sm text-text-secondary">Escuchado</p>
              </div>
            </div>

            {data.months.length === 0 ? (
              <p className="text-body-md text-text-secondary text-center">
                No hay libros terminados en {year}.
              </p>
            ) : (
              <div className="space-y-6">
                {data.months.map(({ month, books }) => (
                  <div key={month}>
                    <h3 className="font-body text-body-lg font-semibold text-accent-wishlist">
                      {MONTH_NAMES[month - 1]}
                    </h3>
                    <div className="h-1.5 rounded-full bg-border mt-2 mb-3" />
                    <div className="grid grid-cols-4 gap-2">
                      {books.map((book) => (
                        <div key={book.id} className="aspect-2/3 rounded-lg overflow-hidden bg-border">
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
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
