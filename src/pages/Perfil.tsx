import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { useAvatarUpload } from '../hooks/useAvatarUpload'
import { useAnnualGoal } from '../hooks/useAnnualGoal'
import { useProfileLists } from '../hooks/useProfileLists'
import { BioEditModal } from '../assets/components/molecules/BioEditModal'
import { DetalleLibro } from './DetalleLibro'
import { TabBar, type TabKey } from '../assets/components/molecules/TabBar'
import { ProfileView } from './ProfileView'

export function Perfil() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { profile, updateProfile } = useProfile(user?.id)
  const { uploadAvatar, isUploading } = useAvatarUpload(user?.id)
  const { goal: annualGoal, completedCount: annualCompletedCount } = useAnnualGoal(user?.id)
  const { currentlyReading, favorites, recommended, wishlist, refetch: refetchLists } = useProfileLists(user?.id)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isBioModalOpen, setIsBioModalOpen] = useState(false)
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null)

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
    <>
      <ProfileView
        readOnly={false}
        username={profile?.username}
        bio={profile?.bio}
        avatarUrl={profile?.avatar_url}
        headerRight={
          <button onClick={() => navigate('/configuracion')} aria-label="Configuración">
            <Menu size={22} className="text-accent-wishlist" />
          </button>
        }
        onAvatarClick={() => fileInputRef.current?.click()}
        isUploadingAvatar={isUploading}
        onEditBioClick={() => setIsBioModalOpen(true)}
        showAnnualGoal={profile?.show_annual_goal}
        annualGoal={annualGoal}
        annualCompletedCount={annualCompletedCount}
        showCurrentlyReading={profile?.show_currently_reading}
        currentlyReading={currentlyReading}
        showFavorites={profile?.show_favorites}
        favorites={favorites}
        showRecommended={profile?.show_recommended}
        recommended={recommended}
        showWishlist={profile?.show_wishlist}
        wishlist={wishlist}
        onBookClick={(id) => setSelectedBookId(id)}
        onSeeAllBooks={(list) => navigate(`/estante?filtro=${list}`)}
        footer={
          <>
            <div className="pb-24" />
            <TabBar active="perfil" onChange={handleTabBarChange} />
          </>
        }
      />

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />

      <BioEditModal
        isOpen={isBioModalOpen}
        onClose={() => setIsBioModalOpen(false)}
        currentBio={profile?.bio ?? ''}
        onSave={async (bio) => updateProfile({ bio })}
      />

      {selectedBookId && (
        <DetalleLibro
          bookId={selectedBookId}
          onClose={() => { setSelectedBookId(null); refetchLists() }}
          onDeleted={() => { setSelectedBookId(null); refetchLists() }}
        />
      )}
    </>
  )
}