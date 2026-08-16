import { useParams, useNavigate } from 'react-router-dom'
import { Flag, ImageOff } from 'lucide-react'
import { useProfileByUsername } from '../hooks/useProfileByUsername'
import { usePublicProfileExtras } from '../hooks/usePublicProfileExtras'
import { useProfileLists } from '../hooks/useProfileLists'
import { Avatar } from '../assets/components/atoms/Avatar'
import { StatBox } from '../assets/components/atoms/StatBox'
import { ProgressBar } from '../assets/components/atoms/ProgressBar'
import { Logo } from '../assets/components/atoms/Logo'
import { formatDuration } from '../lib/progress'
import type { ReadingStatus } from '../lib/status'
import { DogEar } from '../assets/components/atoms/DogEar'

function BookThumb({ book }: { book: { id: string; title: string; cover_url: string | null; status: string } }) {
  return (
    <div className="relative w-20 shrink-0 aspect-2/3 rounded-lg overflow-hidden bg-border">
      {book.cover_url ? (
        <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <ImageOff size={16} className="text-text-secondary" />
        </div>
      )}
      <DogEar status={book.status as ReadingStatus} size={22} className="absolute top-0 right-0" />
    </div>
  )
}

export function PerfilPublico() {
  const { username } = useParams<{ username: string }>()
  const navigate = useNavigate()
  const { profile, isLoading, notFound } = useProfileByUsername(username)
  const { extras } = usePublicProfileExtras(profile?.id)
  const { currentlyReading, favorites, recommended, wishlist } = useProfileLists(profile?.id)

  if (isLoading) {
    return <div className="min-h-screen bg-bg flex items-center justify-center text-text-secondary">Cargando...</div>
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-4 text-center p-6">
        <p className="font-display text-display-lg text-text">Este rincón no existe</p>
        <p className="text-body-md text-text-secondary">No encontramos ningún perfil con ese nombre de usuario.</p>
      </div>
    )
  }

  const goalPercent = extras.annualGoal
    ? Math.min(100, ((extras.annualFinishedCount ?? 0) / extras.annualGoal) * 100)
    : 0

  return (
    <div className="min-h-screen bg-bg p-4">
      <div className="flex justify-center py-2">
        <Logo variant="full" className="h-7" onClick={() => navigate('/')} />
      </div>

      <div className="text-center mt-6">
        <Avatar variant="user" size="lg" src={profile.avatar_url ?? undefined} className="mx-auto" />
        <p className="font-display italic text-display-lg text-text mt-3">@{profile.username}</p>
        {profile.bio && <p className="text-body-md text-text-secondary mt-2 px-6">{profile.bio}</p>}
      </div>

      <div className="mt-8 space-y-6">
        {profile.show_annual_goal && extras.annualGoal !== undefined && (
          <div>
            <h3 className="font-display italic text-display-md text-accent-wishlist">Meta anual de lectura</h3>
            <div className="border-b-6 border-border mt-2 mb-3" />
            <div className="bg-surface border border-border rounded-2xl p-6 text-center">
              <p className="font-display text-display-lg text-text">{extras.annualFinishedCount} de {extras.annualGoal}</p>
              <p className="text-body-md text-text-secondary">libros del {new Date().getFullYear()}</p>
              <ProgressBar percent={goalPercent} className="mt-4" />
            </div>
          </div>
        )}

        {profile.show_daily_streak && extras.longestStreak !== undefined && (
          <div>
            <h3 className="font-display italic text-display-md text-accent-wishlist">Racha diaria más extensa</h3>
            <div className="border-b-6 border-border mt-2 mb-3" />
            <div className="bg-surface border border-border rounded-2xl p-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent-finished flex items-center justify-center shrink-0">
                <Flag size={18} className="text-surface" />
              </div>
              <p className="font-body text-body-lg text-text">{extras.longestStreak} días seguidos</p>
            </div>
          </div>
        )}

        {profile.show_stats && (
          <div>
            <h3 className="font-display italic text-display-md text-accent-wishlist">Estadísticas</h3>
            <div className="border-b-6 border-border mt-2 mb-3" />
            <div className="grid grid-cols-2 gap-3">
              <StatBox label="Páginas leídas" value={(extras.pagesRead ?? 0).toLocaleString()} />
              <StatBox label="Tiempo escuchado" value={formatDuration(extras.audioSeconds ?? 0)} />
              <StatBox label="Libros terminados" value={String(extras.finishedCount ?? 0)} />
              <StatBox label="Libros en proceso" value={String(extras.readingCount ?? 0)} />
              <StatBox label="Libros deseados" value={String(extras.wishlistCount ?? 0)} />
              <StatBox label="Libros abandonados" value={String(extras.abandonedCount ?? 0)} />
              <StatBox label="Sagas registradas" value={String(extras.sagaCount ?? 0)} />
              <StatBox label="Reseñas escritas" value={String(extras.reviewCount ?? 0)} />
            </div>
          </div>
        )}

        {profile.show_years_in_books && (extras.yearsBreakdown?.length ?? 0) > 0 && (
          <div>
            <h3 className="font-display italic text-display-md text-accent-wishlist">Años en libros</h3>
            <div className="border-b-6 border-border mt-2 mb-3" />
            <div className="grid grid-cols-2 gap-3">
              {extras.yearsBreakdown!.map(({ year, count }) => (
                <div key={year} className="bg-surface border border-border rounded-2xl p-4 text-center">
                  <p className="font-display text-display-lg text-accent-wishlist">{year}</p>
                  <p className="text-body-sm text-text-secondary">{count} libros terminados</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {profile.show_currently_reading && currentlyReading.length > 0 && (
          <div>
            <h3 className="font-display italic text-display-md text-accent-wishlist mb-2">Leyendo ahora</h3>
            <div className="flex gap-3 overflow-x-auto">
              {currentlyReading.map((b) => <BookThumb key={b.id} book={b} />)}
            </div>
          </div>
        )}

        {profile.show_favorites && favorites.length > 0 && (
          <div>
            <h3 className="font-display italic text-display-md text-accent-wishlist mb-2">Favoritos</h3>
            <div className="flex gap-3 overflow-x-auto">
              {favorites.map((b) => <BookThumb key={b.id} book={b} />)}
            </div>
          </div>
        )}

        {profile.show_recommended && recommended.length > 0 && (
          <div>
            <h3 className="font-display italic text-display-md text-accent-wishlist mb-2">Recomendados</h3>
            <div className="flex gap-3 overflow-x-auto">
              {recommended.map((b) => <BookThumb key={b.id} book={b} />)}
            </div>
          </div>
        )}

        {profile.show_wishlist && wishlist.length > 0 && (
          <div>
            <h3 className="font-display italic text-display-md text-accent-wishlist mb-2">Lista de deseados</h3>
            <div className="flex gap-3 overflow-x-auto">
              {wishlist.map((b) => <BookThumb key={b.id} book={b} />)}
            </div>
          </div>
        )}
      </div>

      <p className="text-center text-body-sm text-text-secondary mt-10 pb-6">
        Hecho con Teleo — tu diario de lectura
      </p>
    </div>
  )
}