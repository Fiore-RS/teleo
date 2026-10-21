import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { KeyRound } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { authErrorMessage } from '../lib/authErrors'
import { emailInputProps } from '../lib/emailInput'
import { Input } from '../assets/components/atoms/Input'
import { Button } from '../assets/components/atoms/Button'
import { FormHint, FormRow } from '../assets/components/molecules/FormLayout'
import { AuthCard, AuthFootnote, AuthLayout } from '../assets/components/molecules/AuthLayout'

/** "¿Olvidaste tu contraseña?": pide el correo y Supabase manda un enlace. Ese enlace vuelve
 *  a la raíz de Teleo con los datos de recuperación, y main.tsx lleva a /nueva-contrasena.
 *  Si el enlace venció o ya se usó, main.tsx trae de vuelta acá con ?expirado=1. */
export function RecuperarContrasena() {
  const [searchParams] = useSearchParams()
  const linkExpired = searchParams.get('expirado') === '1'
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)

  const canSubmit = /^\S+@\S+\.\S+$/.test(email.trim())

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setError(null)
    setIsLoading(true)

    const cleanEmail = email.trim()
    // Sin ruta después del "#": Supabase agrega sus datos en el "#" y el HashRouter no los
    // entendería como ruta. main.tsx se encarga de llevar a /nueva-contrasena.
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: `${window.location.origin}${window.location.pathname}`,
    })

    setIsLoading(false)

    if (resetError) {
      setError(authErrorMessage(resetError, 'reset'))
      return
    }

    setSentTo(cleanEmail)
  }

  if (sentTo) {
    return (
      <AuthLayout
        centered
        title="Revisa tu correo"
        subtitle={
          <>
            Si hay una cuenta con <span className="font-semibold text-text">{sentTo}</span>, te llegará un enlace para
            crear una contraseña nueva.
          </>
        }
        footer={
          <Link to="/login">
            <Button variant="primary">Volver a iniciar sesión</Button>
          </Link>
        }
      >
        <p className="text-body-sm text-text-muted">Puede tardar unos minutos. Revisa también la carpeta de spam o de promociones.</p>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="¿Olvidaste tu contraseña?"
      subtitle="Escribe el correo de tu cuenta y te enviaremos un enlace para crear una nueva."
      onSubmit={handleSubmit}
      footer={
        <>
          <Button type="submit" variant="primary" isLoading={isLoading} disabled={!canSubmit}>
            Enviar enlace
          </Button>
          <AuthFootnote>
            ¿La recordaste?{' '}
            <Link to="/login" className="text-primary-text font-bold">
              Inicia sesión aquí.
            </Link>
          </AuthFootnote>
        </>
      }
    >
      <AuthCard label="Recuperar contraseña" icon={KeyRound}>
        <FormRow label="Correo" htmlFor="reset-email">
          <Input
            {...emailInputProps}
            bare
            id="reset-email"
            placeholder="tu@correo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="text-right text-body-lg"
          />
        </FormRow>
      </AuthCard>

      {linkExpired && <FormHint text="Ese enlace ya venció o ya se usó. Pide uno nuevo aquí." tone="error" />}
      {error && <FormHint text={error} tone="error" />}
    </AuthLayout>
  )
}
