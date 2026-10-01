import { useState } from 'react'
import { Check } from 'lucide-react'
import { Sheet } from '../atoms/Sheet'
import { Input } from '../atoms/Input'
import { PasswordInput } from '../atoms/PasswordInput'
import { Button } from '../atoms/Button'
import { FormActions, FormCard, FormRow, FormSection } from './FormLayout'
import { ConfirmSheet } from './ConfirmSheet'
import { useAuth } from '../../../hooks/useAuth'
import { useProfile } from '../../../hooks/useProfile'
import { useAccountSettings } from '../../../hooks/useAccountSettings'
import { emailInputProps } from '../../../lib/emailInput'
import { getUsernameCooldownInfo, USERNAME_COOLDOWN_DAYS } from '../../../lib/usernameCooldown'

// Hojas de Configuración › Cuenta (V.2.2.0). Antes eran pantallas aparte que se veían vacías;
// ahora bajan desde arriba sobre Configuración, como el resto de los formularios.

export type AccountSheetKey = 'usuario' | 'nickname' | 'correo' | 'contrasena'

export function AccountSheet({ sheet, onClose }: { sheet: AccountSheetKey; onClose: () => void }) {
  if (sheet === 'usuario') return <ChangeUsernameSheet onClose={onClose} />
  if (sheet === 'nickname') return <ChangeNicknameSheet onClose={onClose} />
  if (sheet === 'correo') return <ChangeEmailSheet onClose={onClose} />
  return <ChangePasswordSheet onClose={onClose} />
}

function Hint({ text, tone = 'muted' }: { text: string; tone?: 'muted' | 'error' | 'ok' }) {
  const color = tone === 'error' ? 'text-primary-text' : tone === 'ok' ? 'text-accent-finished' : 'text-text-muted'
  return (
    <p className={`flex items-center gap-1.5 text-body-sm mt-2 mb-1 px-0.5 animate-fade-in ${color}`}>
      {tone === 'ok' && <Check size={14} strokeWidth={2.6} aria-hidden="true" />}
      {text}
    </p>
  )
}

function ChangeUsernameSheet({ onClose }: { onClose: () => void }) {
  const { user } = useAuth()
  const { profile } = useProfile(user?.id)
  const { updateUsername, isSaving } = useAccountSettings(user?.id)
  const [newUsername, setNewUsername] = useState('')
  const [error, setError] = useState<string | null>(null)
  const { canChange, daysRemaining } = getUsernameCooldownInfo(profile?.username_changed_at ?? null)

  async function handleSave() {
    if (!newUsername.trim() || !canChange) return
    const { error } = await updateUsername(newUsername.trim())
    if (error) { setError(error); return }
    onClose()
  }

  return (
    <Sheet
      onClose={onClose}
      title="Cambiar usuario"
      footer={
        <FormActions>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={handleSave} isLoading={isSaving} disabled={!newUsername.trim() || !canChange}>Guardar</Button>
        </FormActions>
      }
    >
      <div className="animate-fade-in">
        <p className="text-body-md text-text-secondary mb-4">Bajo qué nombre está tu librería virtual.</p>
        <FormSection label="Tu usuario" className="mb-0">
          <FormCard>
            <FormRow label="Actual">
              <span className="text-body-lg text-text-secondary truncate">@{profile?.username ?? ''}</span>
            </FormRow>
            <FormRow label="Nuevo" htmlFor="new-username">
              <span className="flex items-center justify-end min-w-0 w-full">
                <span className="text-body-lg text-text-muted" aria-hidden="true">@</span>
                <Input
                  bare
                  id="new-username"
                  autoFocus={canChange}
                  placeholder="nuevo.usuario"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value.replace(/^@/, ''))}
                  disabled={!canChange}
                  className="text-left text-body-lg w-auto! flex-1 max-w-48 disabled:opacity-50"
                />
              </span>
            </FormRow>
          </FormCard>
        </FormSection>
        <Hint
          text={canChange
            ? `Solo puedes cambiarlo una vez cada ${USERNAME_COOLDOWN_DAYS} días. Para cambiar cómo te saluda Teleo, edita tu nickname.`
            : `Ya cambiaste tu usuario hace poco. Podrás volver a hacerlo en ${daysRemaining} día${daysRemaining === 1 ? '' : 's'}.`}
        />
        {error && <Hint text={error} tone="error" />}
      </div>
    </Sheet>
  )
}

const NICKNAME_MAX = 30

function ChangeNicknameSheet({ onClose }: { onClose: () => void }) {
  const { user } = useAuth()
  const { profile, updateProfile } = useProfile(user?.id)
  // null = todavía no se escribió nada: se muestra el nickname actual.
  const [draft, setDraft] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const value = draft ?? profile?.nickname ?? ''

  async function handleSave() {
    setIsSaving(true)
    await updateProfile({ nickname: value.trim() || null })
    setIsSaving(false)
    onClose()
  }

  return (
    <Sheet
      onClose={onClose}
      title="Cambiar nickname"
      footer={
        <FormActions>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={handleSave} isLoading={isSaving} disabled={draft === null}>Guardar</Button>
        </FormActions>
      }
    >
      <div className="animate-fade-in">
        <p className="text-body-md text-text-secondary mb-4">El nombre con el que Teleo te saluda.</p>
        <FormCard>
          <FormRow label="Nickname" htmlFor="nickname">
            <Input
              bare
              id="nickname"
              autoFocus
              placeholder="¿Cómo te llamamos?"
              value={value}
              onChange={(e) => setDraft(e.target.value.slice(0, NICKNAME_MAX))}
              autoComplete="nickname"
              className="text-right text-body-lg"
            />
          </FormRow>
        </FormCard>
        <Hint text={`Si lo dejas vacío, se muestra tu @${profile?.username ?? 'usuario'}.`} />
      </div>
    </Sheet>
  )
}

function ChangeEmailSheet({ onClose }: { onClose: () => void }) {
  const { user } = useAuth()
  const { updateEmail, isSaving } = useAccountSettings(user?.id)
  const [newEmail, setNewEmail] = useState('')
  const [confirmEmail, setConfirmEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const typedNew = newEmail.trim()
  const typedConfirm = confirmEmail.trim()
  const matches = typedNew !== '' && typedNew.toLowerCase() === typedConfirm.toLowerCase()
  const isSame = typedNew !== '' && typedNew.toLowerCase() === (user?.email ?? '').toLowerCase()
  const isValid = matches && !isSame && typedNew.includes('@')

  async function handleSave() {
    if (!isValid) return
    const { error } = await updateEmail(typedNew)
    if (error) { setError(error); return }
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <ConfirmSheet
        title="Revisa tu correo"
        message={
          <>
            Te enviamos un enlace a <span className="font-semibold text-text">{typedNew}</span>. Tócalo para confirmar el cambio; hasta entonces sigues entrando con tu correo actual.
          </>
        }
        confirmLabel="Listo"
        onClose={onClose}
      />
    )
  }

  let hint: string | null = null
  if (isSame) hint = 'Ese ya es tu correo actual.'
  else if (typedConfirm && !matches) hint = 'Los correos no coinciden.'

  return (
    <Sheet
      onClose={onClose}
      title="Cambiar correo"
      footer={
        <FormActions>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={handleSave} isLoading={isSaving} disabled={!isValid}>Enviar enlace</Button>
        </FormActions>
      }
    >
      <div className="animate-fade-in">
        <p className="text-body-md text-text-secondary mb-4">Te enviaremos un enlace al correo nuevo para confirmarlo.</p>
        <FormSection label="Tu correo" className="mb-0">
          <FormCard>
            <FormRow label="Actual">
              <span className="text-body-lg text-text-secondary truncate">{user?.email ?? ''}</span>
            </FormRow>
            <FormRow label="Nuevo" htmlFor="new-email">
              <Input {...emailInputProps} bare autoFocus id="new-email" placeholder="nuevo@correo.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="text-right text-body-lg" />
            </FormRow>
            <FormRow label="Confirmar" htmlFor="confirm-email">
              <Input {...emailInputProps} bare id="confirm-email" autoComplete="off" placeholder="nuevo@correo.com" value={confirmEmail} onChange={(e) => setConfirmEmail(e.target.value)} className="text-right text-body-lg" />
            </FormRow>
          </FormCard>
        </FormSection>
        {hint && <Hint text={hint} tone="error" />}
        {error && <Hint text={error} tone="error" />}
      </div>
    </Sheet>
  )
}

const PASSWORD_MIN = 6

function ChangePasswordSheet({ onClose }: { onClose: () => void }) {
  const { user } = useAuth()
  const { updatePassword, isSaving } = useAccountSettings(user?.id)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const isLongEnough = newPassword.length >= PASSWORD_MIN
  const matches = confirmPassword.length > 0 && newPassword === confirmPassword
  const isValid = isLongEnough && matches

  let hint: { text: string; tone: 'error' | 'ok' } | null = null
  if (newPassword && !isLongEnough) hint = { text: `Al menos ${PASSWORD_MIN} caracteres.`, tone: 'error' }
  else if (confirmPassword && !matches) hint = { text: 'Las contraseñas no coinciden.', tone: 'error' }
  else if (isValid) hint = { text: `Coinciden y tienen al menos ${PASSWORD_MIN} caracteres.`, tone: 'ok' }

  async function handleSave() {
    if (!isValid) return
    const { error } = await updatePassword(newPassword)
    if (error) { setError(error); return }
    onClose()
  }

  return (
    <Sheet
      onClose={onClose}
      title="Cambiar contraseña"
      footer={
        <FormActions>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={handleSave} isLoading={isSaving} disabled={!isValid}>Guardar contraseña</Button>
        </FormActions>
      }
    >
      <div className="animate-fade-in">
        <p className="text-body-md text-text-secondary mb-4">Elige una nueva contraseña segura.</p>
        <FormCard>
          <FormRow label="Nueva" htmlFor="new-password">
            <PasswordInput bare autoFocus id="new-password" autoComplete="new-password" placeholder="••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </FormRow>
          <FormRow label="Confirmar" htmlFor="confirm-password">
            <PasswordInput bare id="confirm-password" autoComplete="new-password" placeholder="••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </FormRow>
        </FormCard>
        {hint && <Hint text={hint.text} tone={hint.tone} />}
        {error && <Hint text={error} tone="error" />}
      </div>
    </Sheet>
  )
}
