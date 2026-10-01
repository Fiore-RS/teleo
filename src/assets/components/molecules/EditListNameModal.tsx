import { useState } from 'react'
import { Sheet } from '../atoms/Sheet'
import { Input } from '../atoms/Input'
import { Button } from '../atoms/Button'
import { FormActions, FormCard, FormRow } from './FormLayout'

interface EditListNameModalProps {
  isOpen: boolean
  onClose: () => void
  currentName: string
  defaultName: string
  onSave: (name: string | null) => Promise<void>
}

const MAX_LENGTH = 40

/** Nombre de "Mi lista de esta temporada" (rediseñado en la V.2.2.0). Dejar el campo vacío
 *  restablece el nombre por defecto (se guarda `null`, no un string vacío). */
export function EditListNameModal({ isOpen, onClose, currentName, defaultName, onSave }: EditListNameModalProps) {
  const [value, setValue] = useState(currentName)
  const [isSaving, setIsSaving] = useState(false)

  async function handleSave() {
    setIsSaving(true)
    await onSave(value.trim() || null)
    setIsSaving(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <Sheet
      onClose={onClose}
      title="Nombre de tu lista"
      footer={
        <FormActions>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={handleSave} isLoading={isSaving}>Guardar</Button>
        </FormActions>
      }
    >
      <div className="animate-fade-in">
        <FormCard>
          <FormRow label="Nombre" htmlFor="list-name">
            <Input
              bare
              id="list-name"
              autoFocus
              placeholder={defaultName}
              value={value}
              maxLength={MAX_LENGTH}
              onChange={(e) => setValue(e.target.value)}
              className="text-right text-body-lg"
            />
          </FormRow>
        </FormCard>
        <p className="text-body-sm text-text-muted mt-2.5 mb-1 px-0.5">Déjalo vacío para volver a "{defaultName}".</p>
      </div>
    </Sheet>
  )
}
