import { useState } from 'react'
import { Modal } from '../atoms/Modal'
import { Textarea } from '../atoms/Textarea'
import { DateInput } from '../atoms/DateInput'
import { Button } from '../atoms/Button'

interface AbandonarLibroModalProps {
  isOpen: boolean
  onClose: () => void
  bookTitle: string
  initialStartDate: string
  onConfirm: (data: { abandon_reason: string; start_date: string; end_date: string }) => Promise<void>
}

export function AbandonarLibroModal({ isOpen, onClose, bookTitle, initialStartDate, onConfirm }: AbandonarLibroModalProps) {
  const [reason, setReason] = useState('')
  const [startDate, setStartDate] = useState(initialStartDate)
  const [endDate, setEndDate] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  async function handleConfirm() {
    setIsSaving(true)
    await onConfirm({ abandon_reason: reason, start_date: startDate, end_date: endDate })
    setIsSaving(false)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Abandonar libro">
      <p className="text-body-md text-text-secondary text-center mb-4">{bookTitle}</p>

      <label className="text-body-sm text-text-secondary block mb-1">Motivo de abandono</label>
      <Textarea placeholder="Escribe tus pensamientos aquí..." value={reason} onChange={(e) => setReason(e.target.value)} rows={4} />

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div>
          <label className="text-body-sm text-text-secondary block mb-1">Fecha de inicio</label>
          <DateInput value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div>
          <label className="text-body-sm text-text-secondary block mb-1">Fecha de finalización</label>
          <DateInput value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>

      <div className="flex gap-3 mt-5">
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button variant="slate" onClick={handleConfirm} isLoading={isSaving}>Abandonar</Button>
      </div>
    </Modal>
  )
}