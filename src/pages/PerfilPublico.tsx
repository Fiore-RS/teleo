import { useParams, useNavigate } from 'react-router-dom'
import { useProfileByUsername } from '../hooks/useProfileByUsername'
import { usePublicProfileExtras } from '../hooks/usePublicProfileExtras'
import { useProfileLists } from '../hooks/useProfileLists'
import { Logo } from '../assets/components/atoms/Logo'
import { ProfileView } from './ProfileView'

export function PerfilPublico() {
  const { username } = useParams<{ username: string }>()
  const navigate = useNavigate()
  const { profile, isLoading, notFound } = useProfileByUsername(username)
  const { extras } = usePublicProfileExtras(profile?.id)
  const { currentlyReading, favorites, recommended, wishlist } = useProfileLists(profile?.id)

  if (isLoading) {
    return <div className="min-h-screen bg-bg" />
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-4 text-center p-6">
        <p className="font-display text-display-lg text-text">Este rincón no existe</p>
        <p className="text-body-md text-text-secondary">No encontramos ningún perfil con ese nombre de usuario.</p>
      </div>
    )
  }

  return (
    <ProfileView
      readOnly
      username={profile.username}
      bio={profile.bio}
      avatarUrl={profile.avatar_url}
      headerRight={<Logo variant="icon" className="h-7" onClick={() => navigate('/')} />}
      showAnnualGoal={profile.show_annual_goal && extras.annualGoal !== undefined}
      annualGoal={extras.annualGoal}
      annualCompletedCount={extras.annualFinishedCount}
      showDailyStreak={profile.show_daily_streak && extras.longestStreak !== undefined}
      longestStreak={extras.longestStreak}
      showStats={profile.show_stats}
      stats={{
        pagesRead: extras.pagesRead ?? 0,
        audioSeconds: extras.audioSeconds ?? 0,
        finishedCount: extras.finishedCount ?? 0,
        readingCount: extras.readingCount ?? 0,
        wishlistCount: extras.wishlistCount ?? 0,
        abandonedCount: extras.abandonedCount ?? 0,
        sagaCount: extras.sagaCount ?? 0,
        reviewCount: extras.reviewCount ?? 0,
      }}
      showYearsInBooks={profile.show_years_in_books}
      yearsBreakdown={extras.yearsBreakdown}
      showCurrentlyReading={profile.show_currently_reading}
      currentlyReading={currentlyReading}
      showFavorites={profile.show_favorites}
      favorites={favorites}
      showRecommended={profile.show_recommended}
      recommended={recommended}
      showWishlist={profile.show_wishlist}
      wishlist={wishlist}
      footer={
        <p className="text-center text-body-sm text-text-secondary mt-10 pb-6">
          Hecho con Teleo — tu diario de lectura
        </p>
      }
    />
  )
}