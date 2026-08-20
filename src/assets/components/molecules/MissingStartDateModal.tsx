import { useState } from 'react'
import { Modal } from '../atoms/Modal'
import { DateInput } from '../atoms/DateInput'
import { Button } from '../atoms/Button'

interface MissingStartDateModalProps {
  isOpen: boolean
  onConfirm: (startDate: string) => Promise<void>
  onIgnore: () => void
}

/** Popup que avisa, al abrir "Actualizar progreso", que un libro "leyendo" no tiene fecha de
 *  inicio de lectura seleccionada — permite elegir una ahí mismo o ignorar el aviso. */
export function MissingStartDateModal({ isOpen, onConfirm, onIgnore }: MissingStartDateModalProps) {
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [isSaving, setIsSaving] = useState(false)

  async function handleConfirm() {
    if (!startDate) return
    setIsSaving(true)
    await onConfirm(startDate)
    setIsSaving(false)
  }

  return (
    <Modal isOpen={isOpen} onClose={onIgnore} title="Falta la fecha de inicio">
      <p className="text-body-md text-text-secondary mb-4">
        Este libro no tiene una fecha de inicio de lectura seleccionada. ¿Quieres elegir una ahora?
      </p>
      <label className="text-body-sm text-text-secondary block mb-1">Fecha de inicio</label>
      <DateInput value={startDate} onChange={(e) => setStartDate(e.target.value)} />
      <div className="flex gap-3 mt-5">
        <Button variant="outline" className="flex-1" onClick={onIgnore}>Ignorar</Button>
        <Button variant="green" className="flex-1" onClick={handleConfirm} isLoading={isSaving}>Guardar</Button>
      </div>
    </Modal>
  )
}
