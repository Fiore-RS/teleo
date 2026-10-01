import { useState } from 'react'
import { useGoBack } from '../hooks/useGoBack'
import { useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useAccountSettings } from '../hooks/useAccountSettings'
import { PasswordInput } from '../assets/components/atoms/PasswordInput'
import { Button } from '../assets/components/atoms/Button'
import { PageHeader } from '../assets/components/molecules/PageHeader'
import { FormCard, FormRow, FormSection } from '../assets/components/molecules/FormLayout'

const MIN_LENGTH = 6

/** Cambiar contraseña (rediseñada en la V.2.2.0): filas en una tarjeta y un aviso en vivo
 *  que dice si ya está bien o qué falta. */
export function CambiarContrasena() {
  const navigate = useNavigate()
  const goBack = useGoBack('/configuracion')
  const { user } = useAuth()
  const { updatePassword, isSaving } = useAccountSettings(user?.id)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const isLongEnough = newPassword.length >= MIN_LENGTH
  const matches = confirmPassword.length > 0 && newPassword === confirmPassword
  const isValid = isLongEnough && matches

  let hint: { text: string; ok: boolean } | null = null
  if (newPassword && !isLongEnough) hint = { text: `Al menos ${MIN_LENGTH} caracteres.`, ok: false }
  else if (confirmPassword && !matches) hint = { text: 'Las contraseñas no coinciden.', ok: false }
  else if (isValid) hint = { text: 'Coinciden y tienen al menos 6 caracteres.', ok: true }

  async function handleSave() {
    if (!isValid) return
    const { error } = await updatePassword(newPassword)
    if (error) { setError(error); return }
    navigate('/configuracion')
  }

  return (
    <div className="min-h-screen bg-glow-top px-4 pt-4 pb-12">
      <PageHeader title="Cambiar contraseña" subtitle="Elige una nueva contraseña segura." onBack={goBack} backLabel="Regresar a Configuración" />
      <div className="animate-fade-in">
        <FormSection label="Nueva contraseña" className="mb-0">
          <FormCard>
            <FormRow label="Nueva" htmlFor="new-password">
              <PasswordInput bare id="new-password" autoComplete="new-password" placeholder="••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </FormRow>
            <FormRow label="Confirmar" htmlFor="confirm-password">
              <PasswordInput bare id="confirm-password" autoComplete="new-password" placeholder="••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </FormRow>
          </FormCard>
        </FormSection>
        {hint && (
          <p className={`flex items-center gap-1.5 text-body-sm mt-2 px-0.5 animate-fade-in ${hint.ok ? 'text-accent-finished' : 'text-primary-text'}`}>
            {hint.ok && <Check size={14} strokeWidth={2.6} aria-hidden="true" />}
            {hint.text}
          </p>
        )}
        {error && <p className="text-body-sm text-primary-text text-center mt-3">{error}</p>}
        <Button variant="primary" className="mt-6" onClick={handleSave} isLoading={isSaving} disabled={!isValid}>
          Guardar contraseña
        </Button>
      </div>
    </div>
  )
}
