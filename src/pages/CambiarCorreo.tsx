import { useState } from 'react'
import { useGoBack } from '../hooks/useGoBack'
import { useNavigate } from 'react-router-dom'
import { MailCheck } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useAccountSettings } from '../hooks/useAccountSettings'
import { Input } from '../assets/components/atoms/Input'
import { emailInputProps } from '../lib/emailInput'
import { Button } from '../assets/components/atoms/Button'
import { PageHeader } from '../assets/components/molecules/PageHeader'
import { FormCard, FormRow, FormSection } from '../assets/components/molecules/FormLayout'

export function CambiarCorreo() {
  const navigate = useNavigate()
  const goBack = useGoBack('/configuracion')
  const { user } = useAuth()
  const { updateEmail, isSaving } = useAccountSettings(user?.id)
  const [newEmail, setNewEmail] = useState('')
  const [confirmEmail, setConfirmEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const typedNew = newEmail.trim()
  const typedConfirm = confirmEmail.trim()
  const matches = typedNew !== '' && typedNew.toLowerCase() === typedConfirm.toLowerCase()
  const isSame = typedNew !== '' && typedNew.toLowerCase() === (user?.email ?? '').toLowerCase()
  const isValid = matches && !isSame && typedNew.includes('@')

  let hint: string | null = null
  if (isSame) hint = 'Ese ya es tu correo actual.'
  else if (typedConfirm && !matches) hint = 'Los correos no coinciden.'

  async function handleSave() {
    if (!isValid) return
    const { error } = await updateEmail(typedNew)
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
      <PageHeader title="Cambiar correo" subtitle="Te enviaremos un enlace al correo nuevo para confirmarlo." onBack={goBack} backLabel="Regresar a Configuración" />
      <div className="animate-fade-in">
        <FormSection label="Tu correo" className="mb-0">
          <FormCard>
            <FormRow label="Actual">
              <span className="text-body-lg text-text-secondary truncate">{user?.email ?? ''}</span>
            </FormRow>
            <FormRow label="Nuevo" htmlFor="new-email">
              <Input {...emailInputProps} bare id="new-email" placeholder="nuevo@correo.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="text-right text-body-lg" />
            </FormRow>
            <FormRow label="Confirmar" htmlFor="confirm-email">
              <Input {...emailInputProps} bare id="confirm-email" autoComplete="off" placeholder="nuevo@correo.com" value={confirmEmail} onChange={(e) => setConfirmEmail(e.target.value)} className="text-right text-body-lg" />
            </FormRow>
          </FormCard>
        </FormSection>
        {hint && <p className="text-body-sm text-primary-text mt-2 px-0.5 animate-fade-in">{hint}</p>}
        {error && <p className="text-body-sm text-primary-text text-center mt-3">{error}</p>}
        <Button variant="primary" className="mt-6" onClick={handleSave} isLoading={isSaving} disabled={!isValid}>Enviar enlace</Button>
      </div>
    </div>
  )
}
