import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { useAccountSettings } from '../hooks/useAccountSettings'
import { Input } from '../assets/components/atoms/Input'
import { Button } from '../assets/components/atoms/Button'
import { getUsernameCooldownInfo } from '../lib/usernameCooldown'

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
    <div className="min-h-screen bg-bg p-6">
      <button onClick={() => navigate('/configuracion')} className="text-body-sm text-text-secondary mb-6">← Regresar</button>
      <h1 className="font-display text-display-lg text-text text-center">Cambiar nombre de usuario</h1>
      <p className="text-body-md text-text-secondary text-center mt-2">Actualiza bajo qué nombre estará tu librería virtual.</p>

      <label className="text-body-sm text-text-secondary block mb-1 mt-6">Nombre de usuario actual</label>
      <Input value={`@${profile?.username ?? ''}`} disabled />

      <label className="text-body-sm text-text-secondary block mb-1 mt-4">Nuevo nombre de usuario</label>
      <Input
        placeholder="Nuevo usuario..."
        value={newUsername}
        onChange={(e) => setNewUsername(e.target.value)}
        disabled={!canChange}
      />

      <p className="text-body-sm text-text-secondary mt-2">
        {canChange
          ? 'Solo puedes cambiar tu nombre de usuario una vez cada 14 días, piénsalo muy bien.'
          : `Ya cambiaste tu nombre de usuario recientemente. Podrás volver a hacerlo en ${daysRemaining} día${daysRemaining === 1 ? '' : 's'}.`}
      </p>

      {error && <p className="text-body-sm text-accent-wishlist text-center mt-3">{error}</p>}

      <Button
        variant="primary"
        className="mt-6"
        onClick={handleSave}
        isLoading={isSaving}
        disabled={!newUsername.trim() || !canChange}
      >
        Guardar Cambios
      </Button>
    </div>
  )
}