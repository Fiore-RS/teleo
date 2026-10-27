import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { authErrorMessage } from '../lib/authErrors'
import { Input } from '../assets/components/atoms/Input'
import { PasswordInput } from '../assets/components/atoms/PasswordInput'
import { emailInputProps } from '../lib/emailInput'
import { Button } from '../assets/components/atoms/Button'
import { FormHint, FormRow } from '../assets/components/molecules/FormLayout'
import { AuthCard, AuthFootnote, AuthLayout } from '../assets/components/molecules/AuthLayout'

export function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const canSubmit = email.trim() !== '' && password !== ''

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setError(null)
    setIsLoading(true)

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password })

    if (signInError) {
      setIsLoading(false)
      setError(authErrorMessage(signInError, 'login'))
      return
    }

    let hasSeenIntro = true
    const userId = signInData.user?.id
    if (userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('has_seen_intro')
        .eq('id', userId)
        .single()
      hasSeenIntro = profile?.has_seen_intro ?? false
    }

    setIsLoading(false)
    navigate(hasSeenIntro ? '/mesa' : '/bienvenida', { replace: true })
  }

  return (
    <AuthLayout
      title="¡Qué gusto verte de nuevo!"
      subtitle="Inicia sesión para volver a tu rincón de lectura."
      onSubmit={handleSubmit}
      footer={
        <>
          <Button type="submit" variant="primary" isLoading={isLoading} disabled={!canSubmit}>
            Iniciar sesión
          </Button>
          <AuthFootnote>
            ¿Primera vez en Teleo?{' '}
            <Link to="/registro" className="text-primary-text font-bold">
              Regístrate aquí.
            </Link>
          </AuthFootnote>
        </>
      }
    >
      <AuthCard label="Iniciar sesión">
        <FormRow label="Correo" htmlFor="login-email">
          <Input
            {...emailInputProps}
            bare
            id="login-email"
            placeholder="tu@correo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="text-right text-body-lg"
          />
        </FormRow>
        <FormRow label="Contraseña" htmlFor="login-password">
          <PasswordInput
            bare
            id="login-password"
            placeholder="••••••"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </FormRow>
      </AuthCard>

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">{error && <FormHint text={error} tone="error" />}</div>
        <Link to="/recuperar-contrasena" className="shrink-0 mt-2 text-body-sm text-primary-text font-bold">
          ¿Olvidaste tu contraseña?
        </Link>
      </div>
    </AuthLayout>
  )
}
