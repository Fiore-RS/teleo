import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, Pencil, Flag, Menu } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { useAvatarUpload } from '../hooks/useAvatarUpload'
import { useProfileStats } from '../hooks/useProfileStats'
import { useProfileLists } from '../hooks/useProfileLists'
import { useLibraryBooks } from '../hooks/useLibraryBooks'
import { SearchBar } from '../assets/components/molecules/SearchBar'
import { StatBox } from '../assets/components/atoms/StatBox'
import { ProgressBar } from '../assets/components/atoms/ProgressBar'
import { ProfileBookShelf } from '../assets/components/molecules/ProfileBookShelf'
import { BioEditModal } from '../assets/components/molecules/BioEditModal'
import { AddBookModal } from '../assets/components/molecules/AddBookModal'
import { DetalleLibro } from './DetalleLibro'
import { TabBar, type TabKey } from '../assets/components/molecules/TabBar'
import { formatDuration } from '../lib/progress'

export function Perfil() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { profile, updateProfile } = useProfile(user?.id)
  const { uploadAvatar, isUploading } = useAvatarUpload(user?.id)
  const { stats } = useProfileStats(user?.id)
  const { currentlyReading, favorites, recommended, wishlist, refetch: refetchLists } = useProfileLists(user?.id)
  const { addBook } = useLibraryBooks(user?.id)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isBioModalOpen, setIsBioModalOpen] = useState(false)
  const [isAddWishOpen, setIsAddWishOpen] = useState(false)
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null)

  const currentYear = new Date().getFullYear()
  const goalPercent = profile?.annual_goal ? Math.min(100, (stats.finishedCount / profile.annual_goal) * 100) : 0

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    await uploadAvatar(file)
    window.location.reload() // forma simple de refrescar profile.avatar_url en toda la app
  }

  function handleTabBarChange(t: TabKey) {
    navigate(`/${t}`)
  }

  return (
    <div className="min-h-screen bg-bg p-4">
      <SearchBar />

      <div className="mt-10 space-y-6">
        <div className="flex items-center justify-between">
  <h2 className="font-display italic text-display-lg text-accent-wishlist">Tu rincón personal</h2>
  <button onClick={() => navigate('/configuracion')} aria-label="Configuración">
    <Menu size={22} className="text-text" />
  </button>
</div>
        <div className="border-b-6 border-border -mt-4" />

        <div className="text-center">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="relative w-28 h-28 rounded-full mx-auto bg-accent-wishlist flex items-center justify-center overflow-hidden"
          >
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <Camera size={32} className="text-surface" />
            )}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />

          <div className="bg-surface border border-border rounded-2xl p-4 mt-4 text-left">
            <div className="flex items-center justify-between">
              <p className="font-display italic text-display-md text-text">@{profile?.username}</p>
            </div>
            <button onClick={() => setIsBioModalOpen(true)} className="flex items-start gap-2 mt-2 w-full text-left">
              <p className="text-body-sm text-text-secondary flex-1">
                {profile?.bio || 'Agrega una descripción sobre ti...'}
              </p>
              <Pencil size={14} className="text-text-secondary shrink-0 mt-1" />
            </button>
          </div>
        </div>

        {profile?.show_annual_goal && (
          <div>
            <h3 className="font-display italic text-display-md text-accent-wishlist">Meta anual de lectura</h3>
            <div className="border-b-6 border-border mt-2 mb-3" />
            <div className="bg-surface border border-border rounded-2xl p-6 text-center">
              <p className="font-display text-display-lg text-text">{stats.finishedCount} de {profile.annual_goal}</p>
              <p className="text-body-md text-text-secondary">libros del {currentYear}</p>
              <ProgressBar percent={goalPercent} className="mt-4" />
            </div>
          </div>
        )}

        {profile?.show_daily_streak && (
          <div>
            <h3 className="font-display italic text-display-md text-accent-wishlist">Racha diaria más extensa</h3>
            <div className="border-b-6 border-border mt-2 mb-3" />
            <div className="bg-surface border border-border rounded-2xl p-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent-finished flex items-center justify-center shrink-0">
                <Flag size={18} className="text-surface" />
              </div>
              <p className="font-body text-body-lg text-text">{stats.longestStreak} días seguidos</p>
            </div>
          </div>
        )}

        {profile?.show_stats && (
          <div>
            <h3 className="font-display italic text-display-md text-accent-wishlist">Estadísticas</h3>
            <div className="border-b-6 border-border mt-2 mb-3" />
            <div className="grid grid-cols-2 gap-3">
              <StatBox label="Páginas leídas" value={stats.pagesRead.toLocaleString()} />
              <StatBox label="Tiempo escuchado" value={formatDuration(stats.audioSeconds)} />
              <StatBox label="Libros terminados" value={String(stats.finishedCount)} />
              <StatBox label="Libros en proceso" value={String(stats.readingCount)} />
              <StatBox label="Libros deseados" value={String(stats.wishlistCount)} />
              <StatBox label="Libros abandonados" value={String(stats.abandonedCount)} />
              <StatBox label="Sagas registradas" value={String(stats.sagaCount)} />
              <StatBox label="Reseñas escritas" value={String(stats.reviewCount)} />
            </div>
          </div>
        )}

        {profile?.show_years_in_books && stats.yearsBreakdown.length > 0 && (
          <div>
            <h3 className="font-display italic text-display-md text-accent-wishlist">Mis años en libros</h3>
            <div className="border-b-6 border-border mt-2 mb-3" />
            <div className="grid grid-cols-2 gap-3">
              {stats.yearsBreakdown.map(({ year, count }) => (
                <div key={year} className="bg-surface border border-border rounded-2xl p-4 text-center">
                  <p className="font-display text-display-lg text-accent-wishlist">{year}</p>
                  <p className="text-body-sm text-text-secondary">{count} libros terminados</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {profile?.show_currently_reading && (
          <ProfileBookShelf
            title="Leyendo ahora"
            books={currentlyReading}
            onBookClick={(id) => setSelectedBookId(id)}
            onSeeAll={() => navigate('/estante')}
          />
        )}

        {profile?.show_favorites && (
          <ProfileBookShelf
            title="Favoritos"
            books={favorites}
            onBookClick={(id) => setSelectedBookId(id)}
            onSeeAll={() => navigate('/estante')}
          />
        )}

        {profile?.show_recommended && (
          <ProfileBookShelf
            title="Recomendados"
            books={recommended}
            onBookClick={(id) => setSelectedBookId(id)}
            onSeeAll={() => navigate('/estante')}
          />
        )}

        {profile?.show_wishlist && (
          <ProfileBookShelf
            title="Lista de deseados"
            books={wishlist}
            onBookClick={(id) => setSelectedBookId(id)}
            onSeeAll={() => navigate('/estante')}
            onAdd={() => setIsAddWishOpen(true)}
          />
        )}
      </div>

      <div className="pb-10" />
      <TabBar active="perfil" onChange={handleTabBarChange} />

      <BioEditModal
        isOpen={isBioModalOpen}
        onClose={() => setIsBioModalOpen(false)}
        currentBio={profile?.bio ?? ''}
        onSave={async (bio) => updateProfile({ bio })}
      />

      <AddBookModal
        isOpen={isAddWishOpen}
        onClose={() => setIsAddWishOpen(false)}
        initialStatus="deseado"
        onAdd={async (book) => {
          const result = await addBook(book)
          if (!result.error) refetchLists()
          return result
        }}
      />

      {selectedBookId && (
        <DetalleLibro
          bookId={selectedBookId}
          onClose={() => { setSelectedBookId(null); refetchLists() }}
          onDeleted={() => { setSelectedBookId(null); refetchLists() }}
        />
      )}
    </div>
  )
}