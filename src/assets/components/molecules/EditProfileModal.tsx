import { useState } from 'react'
import { Camera, Loader2, UserRound } from 'lucide-react'
import { Modal } from '../atoms/Modal'
import { Input } from '../atoms/Input'
import { Textarea } from '../atoms/Textarea'
import { Button } from '../atoms/Button'
import { Sparkle } from '../atoms/Sparkle'

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
      {/* Mini cabecera: la misma de Tu rincón en chico, con la foto encima. Es una vista previa
          de cómo se ve el perfil; tocar la foto la cambia. Aquí mismo irá la elección de banner. */}
      <div className="relative h-24 rounded-2xl bg-linear-to-br from-primary to-rose overflow-hidden" aria-hidden="true">
        <span className="absolute -top-12 -left-8 w-32 h-32 rounded-full bg-primary-ink/10 blur-2xl" />
        <span className="absolute -bottom-16 right-2 w-40 h-40 rounded-full border border-dashed border-primary-ink/25" />
        <Sparkle size={14} className="absolute left-[46%] top-5 text-primary-ink/45" />
        <Sparkle size={9} className="absolute right-[22%] top-9 text-primary-ink/35" />
        <Sparkle size={8} className="absolute right-8 bottom-5 text-primary-ink/40" />
        <Sparkle size={7} className="absolute left-[30%] top-12 text-primary-ink/30" />
        <span className="absolute left-[60%] top-4 w-1 h-1 rounded-full bg-primary-ink/50" />
        <span className="absolute right-[34%] bottom-6 w-1.5 h-1.5 rounded-full bg-primary-ink/30" />
      </div>

      <div className="flex items-end gap-3.5 px-2 -mt-10">
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

        <div className="min-w-0 pb-1">
          {/* Se actualiza mientras se escribe el nickname, como vista previa. */}
          <p className="font-display font-semibold text-body-lg text-text truncate">{nickname.trim() || username}</p>
          {/* Pista en vez de botón: la foto se cambia tocándola. Cuando llegue el catálogo de
              banners (V.2.1.0), el texto pasa a "Toca tu foto o el banner para cambiarlos". */}
          <p className="flex items-center gap-1.5 mt-0.5 text-body-sm text-text-secondary">
            <Camera size={14} className="shrink-0" aria-hidden="true" />
            {isUploadingPhoto ? 'Subiendo foto...' : avatarUrl ? 'Toca tu foto para cambiarla' : 'Toca la imagen para agregar tu foto'}
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
