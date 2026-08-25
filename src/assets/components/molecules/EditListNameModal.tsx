import { useState } from 'react'
import { Modal } from '../atoms/Modal'
import { Input } from '../atoms/Input'
import { Button } from '../atoms/Button'

interface EditListNameModalProps {
  isOpen: boolean
  onClose: () => void
  currentName: string
  defaultName: string
  onSave: (name: string | null) => Promise<void>
}

const MAX_LENGTH = 40

/** Mismo patrón que `EditGoalModal` — un pop up simple con un input y "Guardar Cambios". Dejar
 *  el campo vacío restablece el nombre por defecto (se guarda `null`, no un string vacío). */
export function EditListNameModal({ isOpen, onClose, currentName, defaultName, onSave }: EditListNameModalProps) {
  const [value, setValue] = useState(currentName)
  const [isSaving, setIsSaving] = useState(false)

  async function handleSave() {
    setIsSaving(true)
    await onSave(value.trim() || null)
    setIsSaving(false)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nombre de tu lista">
      <p className="font-body text-body-md text-text-secondary mb-4">
        Personaliza cómo se llama tu lista de prioridad en Mesa. Déjalo vacío para volver a
        "{defaultName}".
      </p>
      <label className="text-body-sm font-body text-text-secondary mb-1 block">
        Nombre de la lista
      </label>
      <Input
        placeholder={defaultName}
        value={value}
        maxLength={MAX_LENGTH}
        onChange={(e) => setValue(e.target.value)}
      />
      <Button variant="primary" className="mt-4" onClick={handleSave} isLoading={isSaving}>
        Guardar Cambios
      </Button>
    </Modal>
  )
}
