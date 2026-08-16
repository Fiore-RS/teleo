import { useState } from 'react'
import { Modal } from '../atoms/Modal'
import { Textarea } from '../atoms/Textarea'
import { Button } from '../atoms/Button'

interface BioEditModalProps {
  isOpen: boolean
  onClose: () => void
  currentBio: string
  onSave: (bio: string) => Promise<void>
}

export function BioEditModal({ isOpen, onClose, currentBio, onSave }: BioEditModalProps) {
  const [value, setValue] = useState(currentBio)
  const [isSaving, setIsSaving] = useState(false)

  async function handleSave() {
    setIsSaving(true)
    await onSave(value)
    setIsSaving(false)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar biografía">
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value.slice(0, 150))}
        placeholder="Descripción escrita por el usuario como en redes sociales. 150 caracteres máximo."
        rows={3}
      />
      <p className="text-body-sm text-text-secondary text-right mt-1">{value.length}/150</p>
      <Button variant="primary" className="mt-3" onClick={handleSave} isLoading={isSaving}>
        Guardar Cambios
      </Button>
    </Modal>
  )
}