import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useAccountSettings } from '../hooks/useAccountSettings'
import { Input } from '../assets/components/atoms/Input'
import { Button } from '../assets/components/atoms/Button'
import { Lock } from 'lucide-react'

export function CambiarContrasena() {
  const navigate = useNavigate()
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
    <div className="min-h-screen bg-bg p-6">
      <button onClick={() => navigate('/configuracion')} className="text-body-sm text-text-secondary mb-6">← Regresar</button>
      <h1 className="font-display text-display-lg text-text text-center">Cambiar contraseña</h1>
      <p className="text-body-md text-text-secondary text-center mt-2">Elige una nueva contraseña segura.</p>

      <label className="text-body-sm text-text-secondary block mb-1 mt-6">Nueva contraseña</label>
      <Input icon={Lock} type="password" placeholder="Nueva contraseña..." value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />

      <label className="text-body-sm text-text-secondary block mb-1 mt-4">Confirmar contraseña</label>
      <Input icon={Lock} type="password" placeholder="Confirmar contraseña..." value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />

      {error && <p className="text-body-sm text-accent-wishlist text-center mt-3">{error}</p>}

      <Button variant="primary" className="mt-6" onClick={handleSave} isLoading={isSaving}>Guardar Cambios</Button>
    </div>
  )
}