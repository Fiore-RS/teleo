import { HorizontalScroller } from '../atoms/HorizontalScroller'
import type { Database } from '../../../types/database'
import type { ReadingStatus } from '../../../lib/status'
import { DogEar } from '../atoms/DogEar'
import { ImageOff } from 'lucide-react'

type Book = Database['public']['Tables']['books']['Row']

interface ProfileBookShelfProps {
  title: string
  books: Book[]
  onBookClick: (bookId: string) => void
  onSeeAll?: () => void
}

export function ProfileBookShelf({ title, books, onBookClick, onSeeAll }: ProfileBookShelfProps) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="font-display italic text-display-md text-accent-wishlist">{title}</h3>
        {onSeeAll && (
          <button onClick={onSeeAll} className="text-body-sm text-text-secondary">Ver todos</button>
        )}
      </div>
      <div className="border-b-6 border-border mt-2 mb-3" />

      {books.length === 0 && (
        <p className="text-body-sm text-text-secondary">Nada por aquí todavía.</p>
      )}

      <HorizontalScroller>
        {books.map((book) => (
          <button
            key={book.id}
            onClick={() => onBookClick(book.id)}
            className="relative w-28 shrink-0 aspect-2/3 rounded-lg overflow-hidden bg-border"
          >
            {book.cover_url ? (
              <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageOff size={16} className="text-text-secondary" />
              </div>
            )}
            <DogEar status={book.status as ReadingStatus} size={26} className="absolute top-0 right-0" />
          </button>
        ))}
      </HorizontalScroller>
    </div>
  )
}