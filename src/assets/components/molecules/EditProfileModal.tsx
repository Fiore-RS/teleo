import { useState } from 'react'
import { Camera, Loader2, UserRound } from 'lucide-react'
import { Modal } from '../atoms/Modal'
import { Input } from '../atoms/Input'
import { Textarea } from '../atoms/Textarea'
import { Button } from '../atoms/Button'
import { BannerArt } from '../atoms/BannerArt'
import type { BannerId } from '../../../lib/banners'

const NICKNAME_MAX = 30
const BIO_MAX = 150

interface EditProfileModalProps {
  isOpen: boolean
  onClose: () => void
  username: string
  currentNickname: string
  currentBio: string
  avatarUrl?: string | null
  isUploadingPhoto?: boolean
  onChangePhoto: () => void
  banner: BannerId
  /** Abre el catálogo de banners. */
  onChangeBanner: () => void
  onSave: (changes: { nickname: string | null; bio: string | null }) => Promise<void>
}

/** "Editar perfil" (el lápiz de Tu rincón): foto, nickname y bio en un solo lugar. Desde la
 *  V.2.1.0 es el único lugar para cambiar la foto (se quitó la camarita del avatar). El
 *  @usuario no se edita acá porque tiene espera entre cambios; se cambia desde
 *  Configuración → Cambiar usuario. */
export function EditProfileModal({
  isOpen,
  onClose,
  username,
  currentNickname,
  currentBio,
  avatarUrl,
  isUploadingPhoto = false,
  onChangePhoto,
  banner,
  onChangeBanner,
  onSave,
}: EditProfileModalProps) {
  const [nickname, setNickname] = useState(currentNickname)
  const [bio, setBio] = useState(currentBio)
  const [isSaving, setIsSaving] = useState(false)

  async function handleSave() {
    setIsSaving(true)
    // Vacío = sin nickname (se muestra el @usuario) y sin bio.
    await onSave({ nickname: nickname.trim() || null, bio: bio.trim() || null })
    setIsSaving(false)
    onClose()
  }

  const labelClass = 'font-body font-semibold text-body-sm text-text-secondary block mb-1.5'

  return (
    <Modal variant="sheet" isOpen={isOpen} onClose={onClose} title="Editar perfil">
      {/* Mini cabecera: la misma de Tu rincón en chico, con el banner y la foto encima. Es una
          vista previa del perfil: tocar el banner abre el catálogo y tocar la foto la cambia. */}
      <button
        type="button"
        onClick={onChangeBanner}
        aria-label="Cambiar banner"
        className="relative block w-full h-24 rounded-2xl bg-linear-to-br from-primary to-rose overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-text"
      >
        <BannerArt banner={banner} />
      </button>

      <div className="flex items-start gap-3.5 px-2 -mt-10">
        <button
          type="button"
          onClick={onChangePhoto}
          disabled={isUploadingPhoto}
          aria-label={avatarUrl ? 'Cambiar foto de perfil' : 'Agregar foto de perfil'}
          className="relative w-24 h-24 shrink-0 rounded-[26px] border-4 border-surface bg-linear-to-br from-primary to-rose shadow-card flex items-center justify-center overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-text"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className={`w-full h-full object-cover ${isUploadingPhoto ? 'opacity-50' : ''}`} />
          ) : (
            <UserRound size={36} strokeWidth={1.5} className="text-primary-ink" />
          )}
          {isUploadingPhoto && (
            <Loader2 size={24} className="absolute text-primary-ink animate-spin" aria-hidden="true" />
          )}
        </button>

        {/* El texto empieza justo debajo del banner (la foto se sube 40 px sobre él), así el
            nickname nunca se mete en el banner aunque la pista ocupe dos líneas. */}
        <div className="min-w-0 flex-1 pt-12">
          {/* Se actualiza mientras se escribe el nickname, como vista previa. */}
          <p className="font-display font-semibold text-body-lg leading-normal text-text truncate">{nickname.trim() || username}</p>
          {/* Pista en vez de botones: la foto y el banner se cambian tocándolos. */}
          <p className="flex items-center gap-1.5 mt-0.5 text-body-sm text-text-secondary">
            <Camera size={14} className="shrink-0" aria-hidden="true" />
            {isUploadingPhoto ? 'Subiendo foto...' : 'Toca la foto o el banner para cambiarlos'}
          </p>
        </div>
      </div>

      <label htmlFor="perfil-nickname" className={`${labelClass} mt-5`}>Nickname</label>
      <Input
        id="perfil-nickname"
        value={nickname}
        onChange={(e) => setNickname(e.target.value.slice(0, NICKNAME_MAX))}
        placeholder={username ? `Por ejemplo, ${username}` : 'Cómo quieres que te llamen'}
        autoComplete="nickname"
      />
      <p className="text-body-sm text-text-secondary mt-1">
        Así te saluda Teleo. Puedes cambiarlo cuando quieras; tu @{username} sigue igual.
      </p>

      <label htmlFor="perfil-bio" className={`${labelClass} mt-5`}>Sobre mí</label>
      <Textarea
        id="perfil-bio"
        value={bio}
        onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX))}
        placeholder="Cuéntale al mundo qué tipo de lectora o lector eres."
        rows={3}
      />
      <p className="text-body-sm text-text-secondary text-right mt-1">{bio.length}/{BIO_MAX}</p>

      <Button variant="primary" className="mt-3" onClick={handleSave} isLoading={isSaving}>
        Guardar cambios
      </Button>
    </Modal>
  )
}
