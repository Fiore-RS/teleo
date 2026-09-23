import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Mail, MailCheck } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { emailInputProps } from '../lib/emailInput'
import { Input } from '../assets/components/atoms/Input'
import { Button } from '../assets/components/atoms/Button'
import { AuthHeader } from '../assets/components/molecules/AuthHeader'

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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
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
      setError(
        resetError.status === 429
          ? 'Ya pediste un enlace hace poco. Espera un minuto y vuelve a intentarlo.'
          : 'No se pudo enviar el correo. Revisa tu conexión e inténtalo de nuevo.'
      )
      return
    }

    setSentTo(cleanEmail)
  }

  if (sentTo) {
    return (
      <div className="min-h-screen bg-glow-top flex items-center justify-center p-6">
        <div className="w-full max-w-sm bg-surface border border-border rounded-[28px] shadow-card p-6 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary-soft flex items-center justify-center mb-4">
            <MailCheck size={28} strokeWidth={1.75} className="text-primary-text" />
          </div>
          <h1 className="font-display text-display-md text-text font-semibold">Revisa tu correo</h1>
          <p className="font-body text-body-md text-text-secondary mt-2">
            Si hay una cuenta con {sentTo}, te llegará un enlace para crear una contraseña nueva. Puede
            tardar unos minutos; revisa también la carpeta de spam.
          </p>
          <Link to="/login">
            <Button variant="primary" className="mt-6">
              Volver a iniciar sesión
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-glow-top flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-surface border border-border rounded-[28px] shadow-card p-6">
        <AuthHeader
          title="¿Olvidaste tu contraseña?"
          subtitle="Escribe el correo de tu cuenta y te enviaremos un enlace para crear una nueva."
        />

        {linkExpired && (
          <p className="text-body-sm text-primary-text text-center bg-primary-soft rounded-2xl px-3.5 py-2.5 mb-4">
            Ese enlace ya venció o ya se usó. Pide uno nuevo aquí.
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            icon={Mail}
            {...emailInputProps}
            placeholder="Correo electrónico..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {error && <p className="text-body-sm text-primary-text text-center">{error}</p>}

          <Button type="submit" variant="primary" isLoading={isLoading}>
            Enviar enlace
          </Button>
        </form>

        <p className="text-center text-body-sm text-text-secondary mt-4">
          ¿La recordaste?{' '}
          <Link to="/login" className="text-primary-text font-bold">
            Inicia sesión aquí.
          </Link>
        </p>
      </div>
    </div>
  )
}
