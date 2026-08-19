import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ImageOff } from 'lucide-react'
import { CoverImage } from '../assets/components/atoms/CoverImage'
import { useAuth } from '../hooks/useAuth'
import { useReviews } from '../hooks/useReviews'
import { SearchBar } from '../assets/components/molecules/SearchBar'
import { SectionHeader } from '../assets/components/atoms/SectionHeader'
import { Button } from '../assets/components/atoms/Button'
import { RatingRow } from '../assets/components/molecules/RatingRow'
import { TabBar, type TabKey } from '../assets/components/molecules/TabBar'
import { ScrollToTopButton } from '../assets/components/atoms/ScrollToTopButton'
import { SelectReviewBookModal } from '../assets/components/molecules/SelectReviewBookModal'
import { Resena } from './Resena'

export function Cuaderno() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { reviews, isLoading, refetch } = useReviews(user?.id)

  const [search, setSearch] = useState('')
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    if (!search.trim()) return reviews
    const q = search.toLowerCase()
    return reviews.filter((r) => r.book.title.toLowerCase().includes(q) || (r.book.author ?? '').toLowerCase().includes(q))
  }, [reviews, search])

  function handleTabBarChange(t: TabKey) {
    navigate(`/${t}`)
  }

  return (
    <div className="min-h-screen bg-bg p-4">
      <div className="mt-4 space-y-6">
        <SectionHeader title="Tu diario de lectura" rightContent={`${String(filtered.length).padStart(3, '0')} reseñas`} />

        <SearchBar value={search} onChange={(e) => setSearch(e.target.value)} />

        <Button variant="primary" onClick={() => setIsPickerOpen(true)}>Agregar Reseña Nueva</Button>

        {!isLoading && filtered.length === 0 && (
          <p className="text-body-md text-text-secondary text-center">Aún no tienes reseñas escritas.</p>
        )}

        <div className="space-y-4">
          {filtered.map((r) => (
            <div key={r.id} className="bg-surface border border-border rounded-2xl p-4">
              <div className="flex gap-3">
                <div className="relative w-24 shrink-0 aspect-2/3 rounded-lg overflow-hidden bg-border">
                  {r.book.cover_url ? (
                    <CoverImage src={r.book.cover_url ?? undefined} alt={r.book.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><ImageOff size={16} className="text-text-secondary" /></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-body-md text-text line-clamp-2">{r.book.title}</p>
                  <p className="text-body-sm text-text-secondary line-clamp-1 mt-1">{r.book.author}</p>

                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="text-body-sm text-text-secondary bg-bg rounded-full px-3 py-1">
                      Inicio: {r.book.start_date ?? '—'}
                    </span>
                    <span className="text-body-sm text-text-secondary bg-bg rounded-full px-3 py-1">
                      Fin: {r.book.end_date ?? '—'}
                    </span>
                  </div>

                  <RatingRow shape="star" color="var(--color-accent-reading)" value={r.general_rating ?? 0} size={16} className="mt-3" />
                </div>
              </div>

              {r.general_comments && (
                <p className="text-body-sm text-text-secondary line-clamp-3 mt-3 bg-bg rounded-2xl p-4">
                  {r.general_comments}
                </p>
              )}

              <Button variant="amber" className="mt-3 w-full" onClick={() => setSelectedBookId(r.book_id)}>
                Ver Reseña Completa
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="pb-10" />
      <ScrollToTopButton />
      <TabBar active="cuaderno" onChange={handleTabBarChange} />

      <SelectReviewBookModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        userId={user?.id}
        onSelect={(bookId) => { setIsPickerOpen(false); setSelectedBookId(bookId) }}
      />

      {selectedBookId && (
        <Resena bookId={selectedBookId} onClose={() => { setSelectedBookId(null); refetch() }} />
      )}
    </div>
  )
}