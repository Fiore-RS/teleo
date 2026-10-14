import { useState } from 'react'
import { Sheet } from '../atoms/Sheet'
import { Button } from '../atoms/Button'
import { BookMiniHeader, type MiniBook } from './BookMiniHeader'
import { FormActions, FormSection } from './FormLayout'

interface PauseBookSheetProps {
  book: MiniBook
  onClose: () => void
  /** Guarda el libro en pausa con el motivo (vacío si no se escribió). */
  onConfirm: (reason: string) => Promise<void>
}

/** Pausar un libro (V.3.1.0): tan corta como la de abandonar. El progreso se guarda y el motivo
 *  es opcional. Se monta al abrirse. */
export function PauseBookSheet({ book, onClose, onConfirm }: PauseBookSheetProps) {
  const [reason, setReason] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  async function handleConfirm() {
    setIsSaving(true)
    await onConfirm(reason.trim())
    setIsSaving(false)
  }

  return (
    <Sheet
      onClose={onClose}
      title="Pausar libro"
      footer={
        <FormActions>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={handleConfirm} isLoading={isSaving}>Pausar</Button>
        </FormActions>
      }
    >
      <div className="animate-fade-in">
        <BookMiniHeader book={book} />
        <p className="text-body-md text-text-secondary mb-4">
          Tu progreso se guarda. Puedes retomarlo cuando quieras desde los detalles del libro.
        </p>
        <FormSection label="Motivo de la pausa" className="mb-1">
          <div className="relative bg-surface-2 border border-border rounded-[18px] px-4 pt-4.5 pb-3">
            <span aria-hidden="true" className="absolute left-3 -top-2.5 font-display font-semibold text-[40px] leading-none text-ornament select-none">
              “
            </span>
            <textarea
              aria-label="Motivo de la pausa"
              rows={3}
              value={reason}
              placeholder="¿Por qué lo pausas? (opcional)"
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-transparent focus:outline-none resize-none font-body text-body-lg leading-relaxed text-text placeholder:text-text-muted"
            />
          </div>
        </FormSection>
      </div>
    </Sheet>
  )
}
