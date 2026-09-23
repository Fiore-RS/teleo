import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MailCheck } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useAccountSettings } from '../hooks/useAccountSettings'
import { Input } from '../assets/components/atoms/Input'
import { emailInputProps } from '../lib/emailInput'
import { Button } from '../assets/components/atoms/Button'
import { PageHeader } from '../assets/components/molecules/PageHeader'

export function CambiarCorreo() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { updateEmail, isSaving } = useAccountSettings(user?.id)
  const [newEmail, setNewEmail] = useState('')
  const [confirmEmail, setConfirmEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  async function handleSave() {
    if (newEmail.trim() !== confirmEmail.trim()) { setError('Los correos no coinciden.'); return }
    const { error } = await updateEmail(newEmail.trim())
    if (error) { setError(error); return }
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-glow-top flex items-center justify-center p-6 text-center">
        <div>
          <div className="w-16 h-16 rounded-full bg-primary-soft flex items-center justify-center mx-auto mb-4">
            <MailCheck size={28} className="text-primary-text" />
          </div>
          <h1 className="font-display font-semibold text-display-md text-text">Revisa tu bandeja de entrada</h1>
          <p className="text-body-md text-text-secondary mt-2">
            Hemos enviado un enlace de verificación a tu nuevo correo electrónico. Por favor, haz clic en él para confirmar el cambio.
          </p>
          <Button variant="primary" className="mt-6" onClick={() => navigate('/configuracion')}>Volver a Configuración</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-glow-top px-4 pt-4 pb-12">
      <PageHeader title="Cambiar correo" subtitle="Actualiza tu dirección de correo electrónico." onBack={() => navigate('/configuracion')} backLabel="Regresar a Configuración" />
      <div className="bg-surface border border-border rounded-card shadow-card p-[18px]">

      <label className="font-body font-semibold text-body-sm text-text-secondary block mb-1.5">Correo electrónico actual</label>
      <Input value={user?.email ?? ''} disabled />

      <label className="font-body font-semibold text-body-sm text-text-secondary block mb-1.5 mt-4">Nuevo correo electrónico</label>
      <Input {...emailInputProps} placeholder="Nuevo correo..." value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />

      <label className="font-body font-semibold text-body-sm text-text-secondary block mb-1.5 mt-4">Confirmar correo electrónico</label>
      <Input {...emailInputProps} autoComplete="off" placeholder="Confirmar correo..." value={confirmEmail} onChange={(e) => setConfirmEmail(e.target.value)} />

      {error && <p className="text-body-sm text-primary-text text-center mt-3">{error}</p>}

      <Button variant="primary" className="mt-6" onClick={handleSave} isLoading={isSaving}>Guardar cambios</Button>
      </div>
    </div>
  )
}
