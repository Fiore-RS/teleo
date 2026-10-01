import { useState } from 'react'
import { useGoBack } from '../hooks/useGoBack'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { useAccountSettings } from '../hooks/useAccountSettings'
import { Input } from '../assets/components/atoms/Input'
import { Button } from '../assets/components/atoms/Button'
import { PageHeader } from '../assets/components/molecules/PageHeader'
import { FormCard, FormRow, FormSection } from '../assets/components/molecules/FormLayout'
import { getUsernameCooldownInfo, USERNAME_COOLDOWN_DAYS } from '../lib/usernameCooldown'

export function CambiarUsuario() {
  const navigate = useNavigate()
  const goBack = useGoBack('/configuracion')
  const { user } = useAuth()
  const { profile } = useProfile(user?.id)
  const { updateUsername, isSaving } = useAccountSettings(user?.id)
  const [newUsername, setNewUsername] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { canChange, daysRemaining } = getUsernameCooldownInfo(profile?.username_changed_at ?? null)

  async function handleSave() {
    if (!newUsername.trim()) return
    const { error } = await updateUsername(newUsername.trim())
    if (error) { setError(error); return }
    navigate('/configuracion')
  }

  return (
    <div className="min-h-screen bg-glow-top px-4 pt-4 pb-12">
      <PageHeader title="Cambiar usuario" subtitle="Bajo qué nombre está tu librería virtual." onBack={goBack} backLabel="Regresar a Configuración" />
      <div className="animate-fade-in">
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
        <p className="text-body-sm text-text-muted mt-2 px-0.5">
          {canChange
            ? `Solo puedes cambiarlo una vez cada ${USERNAME_COOLDOWN_DAYS} días. Para cambiar cómo te saluda Teleo, edita tu nickname.`
            : `Ya cambiaste tu usuario hace poco. Podrás volver a hacerlo en ${daysRemaining} día${daysRemaining === 1 ? '' : 's'}.`}
        </p>
        {error && <p className="text-body-sm text-primary-text text-center mt-3">{error}</p>}
        <Button
          variant="primary"
          className="mt-6"
          onClick={handleSave}
          isLoading={isSaving}
          disabled={!newUsername.trim() || !canChange}
        >
          Guardar cambios
        </Button>
      </div>
    </div>
  )
}
