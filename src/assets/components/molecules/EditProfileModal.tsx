import { useState } from 'react'
import { Camera } from 'lucide-react'
import { Modal } from '../atoms/Modal'
import { Input } from '../atoms/Input'
import { Textarea } from '../atoms/Textarea'
import { Button } from '../atoms/Button'

const NICKNAME_MAX = 30
const BIO_MAX = 150

interface EditProfileModalProps {
  isOpen: boolean
  onClose: () => void
  username: string
  currentNickname: string
  currentBio: string
  onChangePhoto: () => void
  onSave: (changes: { nickname: string | null; bio: string | null }) => Promise<void>
}

/** "Editar perfil": foto, nickname y bio en un solo lugar. El @usuario no se edita acá
 *  porque tiene espera entre cambios; se cambia desde Configuración → Cambiar usuario. */
export function EditProfileModal({
  isOpen,
  onClose,
  username,
  currentNickname,
  currentBio,
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
    <Modal isOpen={isOpen} onClose={onClose} title="Editar perfil">
      <Button variant="soft" onClick={onChangePhoto}>
        <Camera size={16} />
        Cambiar foto de perfil
      </Button>

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
