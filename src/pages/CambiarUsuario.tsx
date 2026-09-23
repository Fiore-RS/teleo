import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { useAccountSettings } from '../hooks/useAccountSettings'
import { Input } from '../assets/components/atoms/Input'
import { Button } from '../assets/components/atoms/Button'
import { PageHeader } from '../assets/components/molecules/PageHeader'
import { getUsernameCooldownInfo, USERNAME_COOLDOWN_DAYS } from '../lib/usernameCooldown'

export function CambiarUsuario() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { profile } = useProfile(user?.id)
  const { updateUsername, isSaving } = useAccountSettings(user?.id)
  const [newUsername, setNewUsername] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { canChange, daysRemaining } = getUsernameCooldownInfo(profile?.username_changed_at ?? null)

  async function handleSave() {
    if (!newUsername.trim()) return
    const { error } = await updateUsername(newUsername.trim())
    if (error) { setError(error); return }
    navigate('/configuracion')
  }

  return (
    <div className="min-h-screen bg-glow-top px-4 pt-4 pb-12">
      <PageHeader title="Cambiar nombre de usuario" subtitle="Actualiza bajo qué nombre estará tu librería virtual." onBack={() => navigate('/configuracion')} backLabel="Regresar a Configuración" />
      <div className="bg-surface border border-border rounded-card shadow-card p-[18px]">

      <label className="font-body font-semibold text-body-sm text-text-secondary block mb-1.5">Nombre de usuario actual</label>
      <Input value={`@${profile?.username ?? ''}`} disabled />

      <label className="font-body font-semibold text-body-sm text-text-secondary block mb-1.5 mt-4">Nuevo nombre de usuario</label>
      <Input
        placeholder="Nuevo usuario..."
        value={newUsername}
        onChange={(e) => setNewUsername(e.target.value)}
        disabled={!canChange}
      />

      <p className="text-body-sm text-text-secondary mt-2">
        {canChange
          ? `Solo puedes cambiar tu nombre de usuario una vez cada ${USERNAME_COOLDOWN_DAYS} días. Si solo quieres cambiar cómo te llama Teleo, edita tu nickname desde tu perfil.`
          : `Ya cambiaste tu nombre de usuario recientemente. Podrás volver a hacerlo en ${daysRemaining} día${daysRemaining === 1 ? '' : 's'}.`}
      </p>

      {error && <p className="text-body-sm text-primary-text text-center mt-3">{error}</p>}

      <Button
        variant="primary"
        className="mt-6"
        onClick={handleSave}
        isLoading={isSaving}
        disabled={!newUsername.trim() || !canChange}
      >
        Guardar cambios
      </Button>
      </div>
    </div>
  )
}
