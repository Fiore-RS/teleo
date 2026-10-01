import { useState } from 'react'
import { useGoBack } from '../hooks/useGoBack'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { Input } from '../assets/components/atoms/Input'
import { Button } from '../assets/components/atoms/Button'
import { PageHeader } from '../assets/components/molecules/PageHeader'
import { FormCard, FormRow, FormSection } from '../assets/components/molecules/FormLayout'

const NICKNAME_MAX = 30

/** Cambiar nickname desde Configuración > Cuenta. Es el mismo campo que "Editar perfil",
 *  sin espera entre cambios (a diferencia del @usuario). Vacío = sin nickname. */
export function CambiarNickname() {
  const navigate = useNavigate()
  const goBack = useGoBack('/configuracion')
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
    navigate('/configuracion')
  }

  return (
    <div className="min-h-screen bg-glow-top px-4 pt-4 pb-12">
      <PageHeader title="Cambiar nickname" subtitle="El nombre con el que Teleo te saluda." onBack={goBack} backLabel="Regresar a Configuración" />
      <div className="animate-fade-in">
        <FormSection label="Tu nickname" className="mb-0">
          <FormCard>
            <FormRow label="Nickname" htmlFor="nickname">
              <Input
                bare
                id="nickname"
                placeholder="¿Cómo te llamamos?"
                value={value}
                onChange={(e) => setDraft(e.target.value.slice(0, NICKNAME_MAX))}
                autoComplete="nickname"
                className="text-right text-body-lg"
              />
            </FormRow>
          </FormCard>
        </FormSection>
        <p className="text-body-sm text-text-muted mt-2 px-0.5">
          Si lo dejas vacío, se muestra tu @{profile?.username ?? 'usuario'}.
        </p>
        <Button variant="primary" className="mt-6" onClick={handleSave} isLoading={isSaving} disabled={draft === null}>
          Guardar cambios
        </Button>
      </div>
    </div>
  )
}
