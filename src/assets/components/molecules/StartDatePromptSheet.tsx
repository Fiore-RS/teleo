import { useState } from 'react'
import { Sheet } from '../atoms/Sheet'
import { Button } from '../atoms/Button'
import { DateInput } from '../atoms/DateInput'
import { todayLocalDate } from '../../../lib/date'
import { BookMiniHeader, type MiniBook } from './BookMiniHeader'
import { FormActions, FormCard, FormRow } from './FormLayout'

interface StartDatePromptSheetProps {
  title: string
  message: string
  book?: MiniBook | null
  /** Se eligió una fecha y se tocó Guardar. */
  onConfirm: (startDate: string) => Promise<void> | void
  /** "Ahora no" (o cerrar): se sigue sin fecha de inicio. */
  onDismiss: () => void
}

/** Hoja corta para poner la fecha de inicio de una lectura, con hoy ya puesto y una fila para
 *  cambiarla (V.2.2.0). La usan "¡A leer!" (StartReadingDateModal) y "Falta la fecha de
 *  inicio" (MissingStartDateModal). Se monta al abrirse, así la fecha arranca en hoy. */
export function StartDatePromptSheet({ title, message, book, onConfirm, onDismiss }: StartDatePromptSheetProps) {
  const [startDate, setStartDate] = useState(() => todayLocalDate())
  const [isSaving, setIsSaving] = useState(false)

  async function handleConfirm() {
    if (!startDate) return
    setIsSaving(true)
    await onConfirm(startDate)
    setIsSaving(false)
  }

  return (
    <Sheet
      onClose={onDismiss}
      title={title}
      footer={
        <FormActions>
          <Button variant="outline" onClick={onDismiss}>Ahora no</Button>
          <Button variant="primary" onClick={handleConfirm} isLoading={isSaving} disabled={!startDate}>Guardar</Button>
        </FormActions>
      }
    >
      <div className="animate-fade-in">
        {book && <BookMiniHeader book={book} />}
        <p className="text-body-md text-text-secondary mb-3.5">{message}</p>
        <FormCard className="mb-1">
          <FormRow label="Fecha de inicio">
            <DateInput bare value={startDate} max={todayLocalDate()} onChange={(e) => setStartDate(e.target.value)} />
          </FormRow>
        </FormCard>
      </div>
    </Sheet>
  )
}
