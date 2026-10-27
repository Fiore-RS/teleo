import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { authErrorMessage } from '../lib/authErrors'
import { useAuth } from '../hooks/useAuth'
import { PasswordInput } from '../assets/components/atoms/PasswordInput'
import { Button } from '../assets/components/atoms/Button'
import { FormHint, FormRow, type FormHintTone } from '../assets/components/molecules/FormLayout'
import { AuthCard, AuthLayout } from '../assets/components/molecules/AuthLayout'

const PASSWORD_MIN = 6

/** Última parte de "¿Olvidaste tu contraseña?". Se llega desde el enlace del correo: Supabase
 *  ya abrió una sesión temporal de recuperación (ver main.tsx), así que acá solo se guarda
 *  la contraseña nueva. Sin sesión (enlace viejo, o se entró a mano) se ofrece pedir otro. */
export function NuevaContrasena() {
  const navigate = useNavigate()
  const { user, isLoading: isCheckingSession } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Los mismos avisos en vivo que Cambiar contraseña.
  const isLongEnough = password.length >= PASSWORD_MIN
  const matches = confirmPassword.length > 0 && password === confirmPassword
  const isValid = isLongEnough && matches

  let hint: { text: string; tone: FormHintTone } | null = null
  if (password && !isLongEnough) hint = { text: `Al menos ${PASSWORD_MIN} caracteres.`, tone: 'error' }
  else if (confirmPassword && !matches) hint = { text: 'Las contraseñas no coinciden.', tone: 'error' }
  else if (isValid) hint = { text: `Coinciden y tienen al menos ${PASSWORD_MIN} caracteres.`, tone: 'ok' }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!isValid) return
    setError(null)
    setIsSaving(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setIsSaving(false)

    if (updateError) {
      setError(authErrorMessage(updateError, 'newPassword'))
      return
    }

    // La sesión de recuperación ya es una sesión normal: LoadingScreen lleva a Mesa.
    navigate('/', { replace: true })
  }

  if (isCheckingSession) return <div className="min-h-dvh bg-glow-top" />

  if (!user) {
    return (
      <AuthLayout
        centered
        title="Este enlace ya no sirve"
        subtitle="Puede que haya vencido o que ya se haya usado. Pide uno nuevo para crear tu contraseña."
        footer={
          <Link to="/recuperar-contrasena">
            <Button variant="primary">Pedir un enlace nuevo</Button>
          </Link>
        }
      />
    )
  }

  return (
    <AuthLayout
      title="Crea tu contraseña nueva"
      subtitle={
        <>
          Para la cuenta <span className="font-semibold text-text">{user.email ?? ''}</span>.
        </>
      }
      onSubmit={handleSubmit}
      footer={
        <Button type="submit" variant="primary" isLoading={isSaving} disabled={!isValid}>
          Guardar contraseña
        </Button>
      }
    >
      <AuthCard label="Contraseña nueva">
        <FormRow label="Nueva" htmlFor="new-password">
          <PasswordInput
            bare
            id="new-password"
            placeholder="••••••"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </FormRow>
        <FormRow label="Confirmar" htmlFor="confirm-password">
          <PasswordInput
            bare
            id="confirm-password"
            placeholder="••••••"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </FormRow>
      </AuthCard>

      {hint && <FormHint text={hint.text} tone={hint.tone} />}
      {error && <FormHint text={error} tone="error" />}
    </AuthLayout>
  )
}
