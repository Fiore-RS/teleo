import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, Loader2, UserRound, ChevronRight } from 'lucide-react'
import { Sheet } from '../atoms/Sheet'
import { Input } from '../atoms/Input'
import { Button } from '../atoms/Button'
import { FormActions, FormCard, FormRow, FormSection } from './FormLayout'
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
  const navigate = useNavigate()

  async function handleSave() {
    setIsSaving(true)
    // Vacío = sin nickname (se muestra el @usuario) y sin bio.
    await onSave({ nickname: nickname.trim() || null, bio: bio.trim() || null })
    setIsSaving(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <Sheet
      onClose={onClose}
      title="Editar perfil"
      footer={
        <FormActions>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={handleSave} isLoading={isSaving}>Guardar cambios</Button>
        </FormActions>
      }
    >
      <div className="animate-fade-in">
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

      <FormSection label="Tu perfil" className="mt-5">
        <FormCard>
          <FormRow label="Nickname" htmlFor="perfil-nickname">
            <Input
              bare
              id="perfil-nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value.slice(0, NICKNAME_MAX))}
              placeholder={username || 'Cómo quieres que te llamen'}
              autoComplete="nickname"
              className="text-right text-body-lg"
            />
          </FormRow>
          {/* El @usuario tiene espera entre cambios: se cambia desde Configuración. */}
          <FormRow label="Usuario">
            <button
              type="button"
              onClick={() => navigate('/configuracion/usuario')}
              className="flex items-center gap-1 min-w-0 font-body font-bold text-body-md text-primary-text"
            >
              <span className="truncate">@{username} · Cambiar</span>
              <ChevronRight size={16} className="shrink-0" />
            </button>
          </FormRow>
        </FormCard>
      </FormSection>

      <FormSection label="Sobre mí" className="mb-1">
        <div className="bg-surface-2 border border-border rounded-[18px] px-3.5 pt-3 pb-2">
          <textarea
            id="perfil-bio"
            aria-label="Sobre mí"
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX))}
            placeholder="Cuéntale al mundo qué tipo de lectora o lector eres."
            rows={3}
            className="w-full bg-transparent focus:outline-none resize-none font-body text-body-lg leading-relaxed text-text placeholder:text-text-muted"
          />
          <p className="text-body-sm text-text-muted text-right tabular-nums">{bio.length}/{BIO_MAX}</p>
        </div>
      </FormSection>
      </div>
    </Sheet>
  )
}
