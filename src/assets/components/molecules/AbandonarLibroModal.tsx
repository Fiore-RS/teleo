import { useState } from 'react'
import { Sheet } from '../atoms/Sheet'
import { Button } from '../atoms/Button'
import { todayLocalDate } from '../../../lib/date'
import { readingDatesAreValid } from '../../../lib/readingDates'
import { ReadingDatesFields } from './ReadingDatesFields'
import { BookMiniHeader, type MiniBook } from './BookMiniHeader'
import { FormActions, FormSection } from './FormLayout'

interface AbandonarLibroModalProps {
  isOpen: boolean
  onClose: () => void
  book: MiniBook
  initialStartDate: string
  onConfirm: (data: { abandon_reason: string; start_date: string; end_date: string }) => Promise<void>
}

/** Abandonar un libro (rediseñada en la V.2.2.0): primero las fechas ("Lo dejaste" empieza en
 *  hoy) y después el motivo, en la tarjeta con comilla de la reseña. */
export function AbandonarLibroModal({ isOpen, onClose, book, initialStartDate, onConfirm }: AbandonarLibroModalProps) {
  if (!isOpen) return null
  return <AbandonarLibroSheet onClose={onClose} book={book} initialStartDate={initialStartDate} onConfirm={onConfirm} />
}

// Se separa para que el formulario arranque de cero (fecha de hoy incluida) cada vez que se abre.
function AbandonarLibroSheet({ onClose, book, initialStartDate, onConfirm }: Omit<AbandonarLibroModalProps, 'isOpen'>) {
  const [reason, setReason] = useState('')
  const [startDate, setStartDate] = useState(initialStartDate)
  const [endDate, setEndDate] = useState(() => todayLocalDate())
  const [isSaving, setIsSaving] = useState(false)
  const isValid = readingDatesAreValid({ startDate, endDate })

  async function handleConfirm() {
    if (!isValid) return
    setIsSaving(true)
    await onConfirm({ abandon_reason: reason.trim(), start_date: startDate, end_date: endDate })
    setIsSaving(false)
  }

  return (
    <Sheet
      onClose={onClose}
      title="Abandonar libro"
      footer={
        <FormActions>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={handleConfirm} isLoading={isSaving} disabled={!isValid}>Abandonar</Button>
        </FormActions>
      }
    >
      <div className="animate-fade-in">
        <BookMiniHeader book={book} />
        <ReadingDatesFields
          startDate={startDate}
          endDate={endDate}
          endLabel="Lo dejaste"
          showGoalHint={false}
          onChange={(d) => { setStartDate(d.startDate); setEndDate(d.endDate) }}
          className="mb-5"
        />
        <FormSection label="Motivo de abandono" className="mb-1">
          <div className="relative bg-surface-2 border border-border rounded-[18px] px-4 pt-4.5 pb-3">
            <span aria-hidden="true" className="absolute left-3 -top-2.5 font-display font-semibold text-[40px] leading-none text-ornament select-none">
              “
            </span>
            <textarea
              aria-label="Motivo de abandono"
              rows={3}
              value={reason}
              placeholder="¿Por qué lo dejaste? (opcional)"
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-transparent focus:outline-none resize-none font-body text-body-lg leading-relaxed text-text placeholder:text-text-muted"
            />
          </div>
        </FormSection>
      </div>
    </Sheet>
  )
}
