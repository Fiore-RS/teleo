import { useState } from 'react'
import { ImageOff, Quote, Share2, Shuffle } from 'lucide-react'
import { CoverImage } from '../../assets/components/atoms/CoverImage'
import { Skeleton } from '../../assets/components/atoms/Skeleton'
import { Eyebrow } from '../../assets/components/atoms/Eyebrow'
import { Card } from '../../assets/components/molecules/Card'
import type { QuoteWithBook } from '../../hooks/useQuotes'

interface CitasProps {
  quotes: QuoteWithBook[]
  /** true cuando hay algo escrito en la búsqueda (no se muestra la cita al azar). */
  isFiltered: boolean
  isLoading: boolean
  onShare: (quote: QuoteWithBook) => void
  onOpenBook: (bookId: string) => void
}

function BookLine({ quote, onOpenBook }: { quote: QuoteWithBook; onOpenBook: (bookId: string) => void }) {
  const { book } = quote
  return (
    <button
      type="button"
      onClick={() => onOpenBook(book.id)}
      aria-label={`Ver reseña de ${book.title}`}
      className="flex items-center gap-2.5 min-w-0 text-left rounded-lg focus-visible:outline-2 focus-visible:outline-primary-text"
    >
      <div className="w-8 shrink-0 aspect-2/3 rounded-[5px] overflow-hidden bg-surface-2">
        {book.cover_url ? (
          <CoverImage src={book.cover_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><ImageOff size={12} className="text-text-secondary" /></div>
        )}
      </div>
      <div className="min-w-0">
        <p className="text-body-sm font-semibold text-text line-clamp-1">{book.title}</p>
        <p className="text-body-sm text-text-secondary line-clamp-1">
          {[book.author, quote.page != null ? `pág. ${quote.page}` : null].filter(Boolean).join(' · ')}
        </p>
      </div>
    </button>
  )
}

function ShareButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Compartir cita como imagen"
      className="w-9 h-9 shrink-0 rounded-full bg-primary-soft text-primary-text flex items-center justify-center focus-visible:outline-2 focus-visible:outline-primary-text"
    >
      <Share2 size={16} />
    </button>
  )
}

function QuoteCard({
  quote,
  onShare,
  onOpenBook,
}: {
  quote: QuoteWithBook
  onShare: (quote: QuoteWithBook) => void
  onOpenBook: (bookId: string) => void
}) {
  const { book } = quote
  return (
    <article className="bg-surface border border-border rounded-card shadow-card p-3.5">
      <Quote size={14} className="text-ornament" aria-hidden="true" />
      <p className="font-display italic text-body-md leading-snug text-text whitespace-pre-line mt-1.5">{quote.quote_text}</p>
      <div className="flex items-end justify-between gap-2 mt-3 pt-3 border-t border-border">
        <button
          type="button"
          onClick={() => onOpenBook(book.id)}
          aria-label={`Ver reseña de ${book.title}`}
          className="min-w-0 text-left rounded-md focus-visible:outline-2 focus-visible:outline-primary-text"
        >
          <p className="text-body-sm font-semibold text-text line-clamp-2 leading-tight">{book.title}</p>
          {quote.page != null && <p className="text-body-sm text-text-secondary mt-0.5">Pág. {quote.page}</p>}
        </button>
        <button
          type="button"
          onClick={() => onShare(quote)}
          aria-label="Compartir cita como imagen"
          className="w-8 h-8 shrink-0 rounded-full bg-primary-soft text-primary-text flex items-center justify-center focus-visible:outline-2 focus-visible:outline-primary-text"
        >
          <Share2 size={14} />
        </button>
      </div>
    </article>
  )
}

/** Pestaña Citas de Cuaderno (Mis citas, V.2.1.0): una cita al azar arriba y después todas
 *  las citas de tus reseñas, de la más reciente a la más antigua. Tocar el libro abre su
 *  reseña, donde también se pueden editar o quitar las citas. */
export function Citas({ quotes, isFiltered, isLoading, onShare, onOpenBook }: CitasProps) {
  const [randomIndex, setRandomIndex] = useState(() => Math.floor(Math.random() * 1000))
  const random = quotes.length > 0 ? quotes[randomIndex % quotes.length] : null

  function nextRandom() {
    if (quotes.length < 2) return
    let next = Math.floor(Math.random() * quotes.length)
    if (next === randomIndex % quotes.length) next = (next + 1) % quotes.length
    setRandomIndex(next)
  }

  const showRandom = !isFiltered && quotes.length >= 2 && random

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3" aria-label="Cargando">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-surface border border-border rounded-card shadow-card p-[18px]">
            <Skeleton className="h-4 w-full rounded-full" />
            <Skeleton className="h-4 w-4/5 rounded-full mt-2.5" />
            <Skeleton className="h-3.5 w-2/5 rounded-full mt-4" />
          </div>
        ))}
      </div>
    )
  }

  if (quotes.length === 0) {
    return (
      <p className="text-body-md text-text-secondary text-center text-balance">
        {isFiltered ? 'Ninguna cita coincide con tu búsqueda.' : 'Aún no tienes citas guardadas. Toca + para agregar la primera.'}
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {showRandom && (
        <Card labelledBy="cita-al-azar" tint="magenta">
          <div className="flex items-center justify-between gap-2 mb-3">
            <Eyebrow id="cita-al-azar" icon={Shuffle} tone="magenta">Cita al azar</Eyebrow>
            <button
              type="button"
              onClick={nextRandom}
              className="text-body-sm font-bold text-magenta-text rounded-md focus-visible:outline-2 focus-visible:outline-primary-text"
            >
              Otra cita
            </button>
          </div>
          <p key={random.id} className="font-display italic text-[19px] leading-snug text-text animate-fade-in">
            “{random.quote_text}”
          </p>
          <div className="flex items-center justify-between gap-3 mt-4">
            <BookLine quote={random} onOpenBook={onOpenBook} />
            <ShareButton onClick={() => onShare(random)} />
          </div>
        </Card>
      )}

      {/* Dos columnas: las citas se reparten alternando (1 izquierda, 2 derecha, 3 izquierda...)
          para que el orden de más reciente a más antigua se siga leyendo de arriba hacia abajo. */}
      <div className="grid grid-cols-2 gap-3 items-start">
        {[0, 1].map((col) => (
          <div key={col} className="flex flex-col gap-3 min-w-0 stagger-children">
            {quotes
              .filter((_, i) => i % 2 === col)
              .map((q) => (
                <QuoteCard key={q.id} quote={q} onShare={onShare} onOpenBook={onOpenBook} />
              ))}
          </div>
        ))}
      </div>
    </div>
  )
}
