import { useState } from 'react'
import { useGoBack } from '../hooks/useGoBack'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useAccountSettings } from '../hooks/useAccountSettings'
import { PasswordInput } from '../assets/components/atoms/PasswordInput'
import { Button } from '../assets/components/atoms/Button'
import { PageHeader } from '../assets/components/molecules/PageHeader'

export function CambiarContrasena() {
  const navigate = useNavigate()
  const goBack = useGoBack('/configuracion')
  const { user } = useAuth()
  const { updatePassword, isSaving } = useAccountSettings(user?.id)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    if (newPassword.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return }
    if (newPassword !== confirmPassword) { setError('Las contraseñas no coinciden.'); return }
    const { error } = await updatePassword(newPassword)
    if (error) { setError(error); return }
    navigate('/configuracion')
  }

  return (
    <div className="min-h-screen bg-glow-top px-4 pt-4 pb-12">
      <PageHeader title="Cambiar contraseña" subtitle="Elige una nueva contraseña segura." onBack={goBack} backLabel="Regresar a Configuración" />
      <div className="bg-surface border border-border rounded-card shadow-card p-[18px]">

      <label className="font-body font-semibold text-body-sm text-text-secondary block mb-1.5">Nueva contraseña</label>
      <PasswordInput autoComplete="new-password" placeholder="Nueva contraseña..." value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />

      <label className="font-body font-semibold text-body-sm text-text-secondary block mb-1.5 mt-4">Confirmar contraseña</label>
      <PasswordInput autoComplete="new-password" placeholder="Confirmar contraseña..." value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />

      {error && <p className="text-body-sm text-primary-text text-center mt-3">{error}</p>}

      <Button variant="primary" className="mt-6" onClick={handleSave} isLoading={isSaving}>Guardar cambios</Button>
      </div>
    </div>
  )
}
