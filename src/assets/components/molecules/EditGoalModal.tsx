import { useState } from 'react'
import { Modal } from '../atoms/Modal'
import { Input } from '../atoms/Input'
import { Button } from '../atoms/Button'

interface EditGoalModalProps {
  isOpen: boolean
  onClose: () => void
  currentGoal: number
  onSave: (goal: number) => Promise<void>
}

export function EditGoalModal({ isOpen, onClose, currentGoal, onSave }: EditGoalModalProps) {
  const [value, setValue] = useState(String(currentGoal || ''))
  const [isSaving, setIsSaving] = useState(false)

  async function handleSave() {
    const parsed = parseInt(value, 10)
    if (isNaN(parsed) || parsed < 0) return
    setIsSaving(true)
    await onSave(parsed)
    setIsSaving(false)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Meta de lectura">
      <p className="font-body text-body-md text-text-secondary mb-4">
        Establece un número de libros que te gustaría llegar a leer durante este año.
      </p>
      <label className="text-body-sm font-body text-text-secondary mb-1 block">
        Establece una meta anual
      </label>
      <Input
        type="number"
        min={0}
        placeholder="000"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <Button variant="amber" className="mt-4" onClick={handleSave} isLoading={isSaving}>
        Guardar Cambios
      </Button>
    </Modal>
  )
}