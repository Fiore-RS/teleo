import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MailCheck } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useAccountSettings } from '../hooks/useAccountSettings'
import { Input } from '../assets/components/atoms/Input'
import { Button } from '../assets/components/atoms/Button'

export function CambiarCorreo() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { updateEmail, isSaving } = useAccountSettings(user?.id)
  const [newEmail, setNewEmail] = useState('')
  const [confirmEmail, setConfirmEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  async function handleSave() {
    if (newEmail !== confirmEmail) { setError('Los correos no coinciden.'); return }
    const { error } = await updateEmail(newEmail)
    if (error) { setError(error); return }
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6 text-center">
        <div>
          <div className="w-14 h-14 rounded-full bg-accent-reading flex items-center justify-center mx-auto mb-4">
            <MailCheck size={26} className="text-surface" />
          </div>
          <h1 className="font-body text-body-lg font-semibold text-text">Revisa tu bandeja de entrada</h1>
          <p className="text-body-md text-text-secondary mt-2">
            Hemos enviado un enlace de verificación a tu nuevo correo electrónico. Por favor, haz clic en él para confirmar el cambio.
          </p>
          <Button variant="amber" className="mt-6" onClick={() => navigate('/configuracion')}>Volver</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg p-6">
      <button onClick={() => navigate('/configuracion')} className="text-body-sm text-text-secondary mb-6">← Regresar</button>
      <h1 className="font-display text-display-lg text-text text-center">Cambiar correo</h1>
      <p className="text-body-md text-text-secondary text-center mt-2">Actualiza tu dirección de correo electrónico.</p>

      <label className="text-body-sm text-text-secondary block mb-1 mt-6">Correo electrónico actual</label>
      <Input value={user?.email ?? ''} disabled />

      <label className="text-body-sm text-text-secondary block mb-1 mt-4">Nuevo correo electrónico</label>
      <Input type="email" placeholder="Nuevo correo..." value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />

      <label className="text-body-sm text-text-secondary block mb-1 mt-4">Confirmar correo electrónico</label>
      <Input type="email" placeholder="Confirmar correo..." value={confirmEmail} onChange={(e) => setConfirmEmail(e.target.value)} />

      {error && <p className="text-body-sm text-accent-wishlist text-center mt-3">{error}</p>}

      <Button variant="primary" className="mt-6" onClick={handleSave} isLoading={isSaving}>Guardar Cambios</Button>
    </div>
  )
}