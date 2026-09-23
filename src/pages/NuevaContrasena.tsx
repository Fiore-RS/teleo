import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { PasswordInput } from '../assets/components/atoms/PasswordInput'
import { Button } from '../assets/components/atoms/Button'
import { AuthHeader } from '../assets/components/molecules/AuthHeader'

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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return }
    if (password !== confirmPassword) { setError('Las contraseñas no coinciden.'); return }

    setIsSaving(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setIsSaving(false)

    if (updateError) {
      setError(
        updateError.code === 'same_password'
          ? 'La contraseña nueva tiene que ser distinta a la anterior.'
          : 'No se pudo guardar la contraseña. Inténtalo de nuevo.'
      )
      return
    }

    // La sesión de recuperación ya es una sesión normal: LoadingScreen lleva a Mesa.
    navigate('/', { replace: true })
  }

  if (isCheckingSession) return <div className="min-h-screen bg-glow-top" />

  if (!user) {
    return (
      <div className="min-h-screen bg-glow-top flex items-center justify-center p-6">
        <div className="w-full max-w-sm bg-surface border border-border rounded-[28px] shadow-card p-6">
          <AuthHeader
            title="Este enlace ya no sirve"
            subtitle="Puede que haya vencido o que ya se haya usado. Pide uno nuevo para crear tu contraseña."
          />
          <Link to="/recuperar-contrasena">
            <Button variant="primary">Pedir un enlace nuevo</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-glow-top flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-surface border border-border rounded-[28px] shadow-card p-6">
        <AuthHeader
          title="Crea tu contraseña nueva"
          subtitle={`Para la cuenta ${user.email ?? ''}. Usa al menos 6 caracteres.`}
        />

        <form onSubmit={handleSubmit} className="space-y-4">
          <PasswordInput
            placeholder="Contraseña nueva..."
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          <PasswordInput
            placeholder="Confirmar contraseña..."
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          {error && <p className="text-body-sm text-primary-text text-center">{error}</p>}

          <Button type="submit" variant="primary" isLoading={isSaving}>
            Guardar contraseña
          </Button>
        </form>
      </div>
    </div>
  )
}
