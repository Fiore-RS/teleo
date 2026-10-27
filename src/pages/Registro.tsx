import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Check, Loader2, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { authErrorMessage } from '../lib/authErrors'
import { Input } from '../assets/components/atoms/Input'
import { PasswordInput } from '../assets/components/atoms/PasswordInput'
import { emailInputProps } from '../lib/emailInput'
import { Button } from '../assets/components/atoms/Button'
import { FormHint, FormRow, type FormHintTone } from '../assets/components/molecules/FormLayout'
import { AuthCard, AuthFootnote, AuthLayout } from '../assets/components/molecules/AuthLayout'
import { InviterAvatar } from '../assets/components/molecules/InviterCard'
import { inviterDisplayName, useInviterPreview } from '../hooks/useInviterPreview'
import { clearInviteCode, readInviteCode } from '../lib/invite'
import { isRunningStandalone } from '../lib/installPrompt'
import {
  cleanUsernameInput,
  getUsernameIssue,
  usernameFreeMessage,
  usernameIssueMessage,
  usernameTakenMessage,
} from '../lib/username'

const PASSWORD_MIN = 6
/** Espera después de la última letra antes de preguntar si el @ está libre. */
const USERNAME_CHECK_DELAY_MS = 400

type Availability = 'idle' | 'checking' | 'free' | 'taken' | 'unknown'

export function Registro() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [submittedTo, setSubmittedTo] = useState<string | null>(null)
  // Última respuesta de username_available, con el @ al que corresponde: si se siguió
  // escribiendo, no sirve y se muestra "Comprobando…" hasta la siguiente.
  const [checked, setChecked] = useState<{ name: string; free: boolean | null } | null>(null)
  // V.3.3.0: el código que dejó la portada al llegar con una invitación.
  const [inviteCode] = useState(readInviteCode)
  const { inviter } = useInviterPreview(inviteCode)

  // Reglas del @ (0035). "Muy corto" no se marca mientras se escribe, para no mostrar un
  // error desde la primera letra; solo deja el botón apagado.
  const usernameIssue = username ? getUsernameIssue(username) : null
  const liveIssue = usernameIssue && usernameIssue !== 'short' ? usernameIssue : null

  useEffect(() => {
    if (!username || usernameIssue) return
    const timer = window.setTimeout(async () => {
      const { data, error: rpcError } = await supabase.rpc('username_available', { name: username })
      setChecked({ name: username, free: rpcError ? null : data })
    }, USERNAME_CHECK_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [username, usernameIssue])

  let availability: Availability = 'idle'
  if (username && !usernameIssue) {
    if (checked?.name !== username) availability = 'checking'
    else availability = checked.free === null ? 'unknown' : checked.free ? 'free' : 'taken'
  }

  const isLongEnough = password.length >= PASSWORD_MIN
  const matches = confirmPassword.length > 0 && password === confirmPassword
  const emailLooksValid = /^\S+@\S+\.\S+$/.test(email.trim())
  // Si no se pudo comprobar el @ ('unknown'), se deja intentar: el índice de la base lo frena.
  const canSubmit =
    username !== '' && !usernameIssue && availability !== 'taken' && availability !== 'checking' &&
    emailLooksValid && isLongEnough && matches

  let usernameHint: { text: string; tone: FormHintTone } | null = null
  if (liveIssue) usernameHint = { text: usernameIssueMessage(liveIssue), tone: 'error' }
  else if (availability === 'checking') usernameHint = { text: 'Comprobando…', tone: 'loading' }
  else if (availability === 'taken') usernameHint = { text: usernameTakenMessage(username), tone: 'error' }
  else if (availability === 'free') usernameHint = { text: usernameFreeMessage(username), tone: 'ok' }

  let passwordHint: { text: string; tone: FormHintTone } | null = null
  if (password && !isLongEnough) passwordHint = { text: `Al menos ${PASSWORD_MIN} caracteres.`, tone: 'error' }
  else if (confirmPassword && !matches) passwordHint = { text: 'Las contraseñas no coinciden.', tone: 'error' }
  else if (isLongEnough && matches) passwordHint = { text: `Coinciden y tienen al menos ${PASSWORD_MIN} caracteres.`, tone: 'ok' }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setError(null)
    setIsLoading(true)

    const cleanEmail = email.trim()
    const { error: signUpError } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        // Solo si el código es de alguien: handle_new_user (0035) guarda quién invitó.
        data: inviter && inviteCode ? { username, invite_code: inviteCode } : { username },
        emailRedirectTo: `${window.location.origin}${window.location.pathname}#/login`,
      },
    })

    setIsLoading(false)

    if (signUpError) {
      setError(authErrorMessage(signUpError, 'signup'))
      return
    }

    clearInviteCode()
    setSubmittedTo(cleanEmail)
  }

  if (submittedTo) {
    // V.3.3.0: en el navegador (no en la app instalada), mientras llega el correo se ofrece
    // instalar Teleo. Así quien llega por una invitación se registra primero (queda guardado
    // quién la invitó) y después instala, con un solo enlace.
    const canInstall = !isRunningStandalone()
    return (
      <AuthLayout
        centered
        title="Revisa tu correo"
        subtitle={
          <>
            Te enviamos un enlace a <span className="font-semibold text-text">{submittedTo}</span>. Tócalo para
            activar tu cuenta{canInstall ? ' y después entra desde aquí o desde la app.' : ' y vuelve aquí para entrar.'}
          </>
        }
        footer={
          canInstall ? (
            <>
              <Link to="/instalar">
                <Button variant="primary">Instalar Teleo mientras tanto</Button>
              </Link>
              <Link to="/login">
                <Button variant="outline">Ir a iniciar sesión</Button>
              </Link>
            </>
          ) : (
            <Link to="/login">
              <Button variant="primary">Ir a iniciar sesión</Button>
            </Link>
          )
        }
      >
        {canInstall && (
          <p className="text-body-md text-text-secondary">
            Mientras esperas, puedes tener Teleo en tu pantalla de inicio, como cualquier app.
          </p>
        )}
        <p className={`text-body-sm text-text-muted ${canInstall ? 'mt-3' : ''}`}>
          Si no te llega en unos minutos, revisa la carpeta de spam o de promociones.
        </p>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Crea tu rincón de lectura"
      subtitle="Tu espacio personal para registrar, valorar y recordar cada libro en tu vida."
      onSubmit={handleSubmit}
      footer={
        <>
          <Button type="submit" variant="primary" isLoading={isLoading} disabled={!canSubmit}>
            Crear cuenta
          </Button>
          <AuthFootnote>
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-primary-text font-bold">
              Inicia sesión aquí.
            </Link>
          </AuthFootnote>
        </>
      }
    >
      <AuthCard label="Tu cuenta">
        {inviter && (
          <FormRow label="Te invitó">
            <span className="flex items-center justify-end gap-2 min-w-0">
              <InviterAvatar inviter={inviter} size="sm" />
              <span className="text-body-lg text-text-secondary truncate">{inviterDisplayName(inviter)}</span>
            </span>
          </FormRow>
        )}
        <FormRow label="Usuario" htmlFor="signup-username">
          <span className="flex items-center justify-end min-w-0 w-full">
            {/* La @ va dentro del texto (y no como prefijo aparte) para que la fila quede
                alineada a la derecha como Correo y Contraseña. cleanUsernameInput la quita. */}
            <Input
              bare
              id="signup-username"
              placeholder="@tu.usuario"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              autoComplete="username"
              value={username ? `@${username}` : ''}
              onChange={(e) => setUsername(cleanUsernameInput(e.target.value))}
              aria-invalid={liveIssue || availability === 'taken' ? true : undefined}
              className="text-right text-body-lg"
            />
            <UsernameStatus availability={availability} hasIssue={liveIssue !== null} />
          </span>
        </FormRow>
        <FormRow label="Correo" htmlFor="signup-email">
          <Input
            {...emailInputProps}
            bare
            id="signup-email"
            placeholder="tu@correo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="text-right text-body-lg"
          />
        </FormRow>
        <FormRow label="Contraseña" htmlFor="signup-password">
          <PasswordInput
            bare
            id="signup-password"
            placeholder="••••••"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </FormRow>
        <FormRow label="Confirmar" htmlFor="signup-confirm">
          <PasswordInput
            bare
            id="signup-confirm"
            placeholder="••••••"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </FormRow>
      </AuthCard>

      {usernameHint && <FormHint text={usernameHint.text} tone={usernameHint.tone} />}
      {(availability === 'idle' || availability === 'free') && !liveIssue && (
        <FormHint text="Tu @usuario aparece en tu perfil y en tu tarjeta. El nombre con el que Teleo te saluda lo eliges después." />
      )}
      {passwordHint && <FormHint text={passwordHint.text} tone={passwordHint.tone} />}
      {error && <FormHint text={error} tone="error" />}
    </AuthLayout>
  )
}

/** Marca al final de la fila del @: girando mientras se comprueba, ✓ si está libre y ✕ si no. */
function UsernameStatus({ availability, hasIssue }: { availability: Availability; hasIssue: boolean }) {
  if (hasIssue || availability === 'taken') {
    return <X size={16} strokeWidth={2.4} className="ml-1.5 shrink-0 text-primary-text" aria-hidden="true" />
  }
  if (availability === 'free') {
    return <Check size={16} strokeWidth={2.6} className="ml-1.5 shrink-0 text-accent-finished" aria-hidden="true" />
  }
  if (availability === 'checking') {
    return <Loader2 size={15} strokeWidth={2.4} className="ml-1.5 shrink-0 text-text-muted animate-spin motion-reduce:animate-none" aria-hidden="true" />
  }
  return null
}
