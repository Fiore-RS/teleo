import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PenLine, Settings } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { useAvatarUpload } from '../hooks/useAvatarUpload'
import { useAnnualGoal } from '../hooks/useAnnualGoal'
import { useProfileLists } from '../hooks/useProfileLists'
import { EditProfileModal } from '../assets/components/molecules/EditProfileModal'
import { DetalleLibro } from './DetalleLibro'
import { TabBar, type TabKey } from '../assets/components/molecules/TabBar'
import { ProfileView } from './ProfileView'

// Botones redondos translúcidos sobre la cabecera de degradado (Configuración y Editar perfil).
const headerButtonClass =
  'w-10 h-10 shrink-0 rounded-full bg-surface/20 border border-primary-ink/30 text-primary-ink backdrop-blur-sm flex items-center justify-center focus-visible:outline-2 focus-visible:outline-primary-ink'

export function Perfil() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { profile, updateProfile, isLoading: profileLoading } = useProfile(user?.id)
  const { uploadAvatar, isUploading } = useAvatarUpload(user?.id)
  const { goal: annualGoal, completedCount: annualCompletedCount } = useAnnualGoal(user?.id)
  const { currentlyReading, favorites, recommended, wishlist, refetch: refetchLists, isLoading: listsLoading } = useProfileLists(user?.id)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false)
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
        username={profile?.username}
        nickname={profile?.nickname}
        isProfileLoading={profileLoading}
        areListsLoading={listsLoading}
        bio={profile?.bio}
        avatarUrl={profile?.avatar_url}
        headerRight={
          <div className="flex flex-col gap-2">
            <button
              onClick={() => navigate('/configuracion')}
              aria-label="Configuración"
              className={headerButtonClass}
            >
              <Settings size={19} />
            </button>
            <button
              onClick={() => setIsEditProfileOpen(true)}
              aria-label="Editar perfil"
              className={headerButtonClass}
            >
              <PenLine size={18} />
            </button>
          </div>
        }
        onAvatarClick={() => fileInputRef.current?.click()}
        isUploadingAvatar={isUploading}
        annualGoal={annualGoal}
        annualCompletedCount={annualCompletedCount}
        currentlyReading={currentlyReading}
        favorites={favorites}
        recommended={recommended}
        wishlist={wishlist}
        onBookClick={(id) => setSelectedBookId(id)}
        onSeeAllBooks={(list) => navigate(`/estante?filtro=${list}`)}
        footer={
          <>
            <div className="pb-28" />
            <TabBar active="perfil" onChange={handleTabBarChange} />
          </>
        }
      />

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />

      {/* Se monta al abrir para que los campos arranquen con los valores actuales del perfil. */}
      {isEditProfileOpen && (
        <EditProfileModal
          isOpen
          onClose={() => setIsEditProfileOpen(false)}
          username={profile?.username ?? ''}
          currentNickname={profile?.nickname ?? ''}
          currentBio={profile?.bio ?? ''}
          onChangePhoto={() => fileInputRef.current?.click()}
          onSave={async (changes) => updateProfile(changes)}
        />
      )}

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