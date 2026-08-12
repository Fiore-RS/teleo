import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { User, Mail, Lock, MailCheck } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Input } from '../assets/components/atoms/Input'
import { Button } from '../assets/components/atoms/Button'
import { AuthHeader } from '../assets/components/molecules/AuthHeader'

export function Registro() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    })

    setIsLoading(false)

    if (signUpError) {
      setError(signUpError.message)
      return
    }

    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6">
        <div className="w-full max-w-sm bg-surface rounded-3xl p-6 border border-border text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-accent-reading flex items-center justify-center mb-4">
            <MailCheck size={26} strokeWidth={1.75} className="text-surface" />
          </div>
          <h1 className="font-display text-display-md text-text font-semibold">
            Revisa tu bandeja de entrada
          </h1>
          <p className="font-body text-body-md text-text-secondary mt-2">
            Te enviamos un enlace de verificación a {email}. Haz clic en él para activar tu cuenta.
          </p>
          <Link to="/login">
            <Button variant="primary" className="mt-6">
              Volver a Inicio de Sesión
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-surface rounded-3xl p-6 border border-border">
        <AuthHeader
          title="Crea tu rincón de lectura"
          subtitle="Tu espacio personal para registrar, valorar y recordar cada libro en tu vida."
        />

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            icon={User}
            type="text"
            placeholder="Nombre o seudónimo..."
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <Input
            icon={Mail}
            type="email"
            placeholder="Correo electrónico..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            icon={Lock}
            type="password"
            placeholder="Contraseña..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />

          {error && <p className="text-body-sm text-accent-wishlist text-center">{error}</p>}

          <Button type="submit" variant="primary" isLoading={isLoading}>
            Crear Cuenta
          </Button>
        </form>

        <p className="text-center text-body-sm text-text-secondary mt-4">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-accent-wishlist font-medium">
            Inicia sesión aquí.
          </Link>
        </p>
      </div>
    </div>
  )
}