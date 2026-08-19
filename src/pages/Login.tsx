import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Input } from '../assets/components/atoms/Input'
import { Button } from '../assets/components/atoms/Button'
import { AuthHeader } from '../assets/components/molecules/AuthHeader'

export function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      setIsLoading(false)
      setError(
        signInError.message.includes('Email not confirmed')
          ? 'Confirma tu correo antes de iniciar sesión.'
          : 'Correo o contraseña incorrectos.'
      )
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
    <div className="min-h-screen bg-bg flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-surface rounded-3xl p-6 border border-border">
        <AuthHeader
          title="¡Qué gusto verte de nuevo!"
          subtitle="Inicia sesión nuevamente para volver a tu rincón de lectura."
        />

        <form onSubmit={handleSubmit} className="space-y-4">
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
          />

          {error && <p className="text-body-sm text-accent-wishlist text-center">{error}</p>}

          <Button type="submit" variant="primary" isLoading={isLoading}>
            Iniciar Sesión
          </Button>
        </form>

        <p className="text-center text-body-sm text-text-secondary mt-4">
          ¿Primera vez en Teleo?{' '}
          <Link to="/registro" className="text-accent-wishlist font-medium">
            Regístrate aquí.
          </Link>
        </p>
      </div>
    </div>
  )
}