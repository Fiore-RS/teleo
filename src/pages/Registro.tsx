import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AtSign, Mail, MailCheck } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { authErrorMessage } from '../lib/authErrors'
import { Input } from '../assets/components/atoms/Input'
import { PasswordInput } from '../assets/components/atoms/PasswordInput'
import { emailInputProps } from '../lib/emailInput'
import { Button } from '../assets/components/atoms/Button'
import { AuthHeader } from '../assets/components/molecules/AuthHeader'
import { cleanUsernameInput, getUsernameIssue, usernameIssueMessage, usernameTakenMessage } from '../lib/username'

export function Registro() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // El @ se revisa mientras se escribe (reglas de 0035: minúsculas, números, punto y guion
  // bajo, de 3 a 30). "Muy corto" se avisa recién al intentar crear la cuenta, para no
  // marcar error desde la primera letra.
  const usernameIssue = getUsernameIssue(username)
  const liveIssue = usernameIssue && usernameIssue !== 'short' ? usernameIssue : null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (usernameIssue) {
      setError(usernameIssueMessage(usernameIssue))
      return
    }
    setIsLoading(true)

    // Si el @ ya existe, se avisa con ese motivo en vez del error genérico de Supabase. Si la
    // consulta falla, se sigue igual: el índice de la base lo frena de todos modos.
    const { data: isAvailable } = await supabase.rpc('username_available', { name: username })
    if (isAvailable === false) {
      setIsLoading(false)
      setError(usernameTakenMessage(username))
      return
    }

    const { error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { username },
        emailRedirectTo: `${window.location.origin}${window.location.pathname}#/login`,
      },
    })

    setIsLoading(false)

    if (signUpError) {
      setError(authErrorMessage(signUpError, 'signup'))
      return
    }

    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-glow-top flex items-center justify-center p-6">
        <div className="w-full max-w-sm bg-surface border border-border rounded-[28px] shadow-card p-6 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary-soft flex items-center justify-center mb-4">
            <MailCheck size={28} strokeWidth={1.75} className="text-primary-text" />
          </div>
          <h1 className="font-title text-[28px] leading-[1.1] text-text">
            Revisa tu bandeja de entrada
          </h1>
          <p className="font-body text-body-md text-text-secondary mt-2">
            Te enviamos un enlace de verificación a {email.trim()}. Haz clic en él para activar tu cuenta.
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
          title="Crea tu rincón de lectura"
          subtitle="Tu espacio personal para registrar, valorar y recordar cada libro en tu vida."
        />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              icon={AtSign}
              type="text"
              placeholder="nombre.de.usuario"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(cleanUsernameInput(e.target.value))}
              aria-invalid={liveIssue ? true : undefined}
              required
            />
            <p className={`text-body-sm mt-1.5 px-1 ${liveIssue ? 'text-primary-text' : 'text-text-muted'}`}>
              {liveIssue
                ? usernameIssueMessage(liveIssue)
                : 'Tu @usuario: minúsculas, números, punto y guion bajo. El nombre con el que Teleo te saluda lo eliges después.'}
            </p>
          </div>
          <Input
            icon={Mail}
            {...emailInputProps}
            placeholder="Correo electrónico..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <PasswordInput
            placeholder="Contraseña..."
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />

          {error && <p className="text-body-sm text-primary-text text-center">{error}</p>}

          <Button type="submit" variant="primary" isLoading={isLoading}>
            Crear cuenta
          </Button>
        </form>

        <p className="text-center text-body-sm text-text-secondary mt-4">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-primary-text font-bold">
            Inicia sesión aquí.
          </Link>
        </p>
      </div>
    </div>
  )
}