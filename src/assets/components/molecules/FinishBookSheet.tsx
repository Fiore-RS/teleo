import { useState } from 'react'
import { PenLine } from 'lucide-react'
import { Sheet } from '../atoms/Sheet'
import { Button } from '../atoms/Button'
import { todayLocalDate } from '../../../lib/date'
import { ReadingDatesFields } from './ReadingDatesFields'
import { BookMiniHeader, type MiniBook } from './BookMiniHeader'
import { FormActions } from './FormLayout'
import { readingDatesAreValid, type ReadingDates } from '../../../lib/readingDates'

interface FinishBookSheetProps {
  book: MiniBook
  initialStartDate: string | null
  onClose: () => void
  /** Guarda el libro como terminado con esas fechas. `writeReview` indica si después se abre
   *  la reseña. */
  onConfirm: (dates: ReadingDates, writeReview: boolean) => Promise<void>
}

/** "¡Lo terminaste!" (fase 2.6, rediseñada en la V.2.2.0): al marcar un libro como terminado
 *  se eligen las fechas ahí mismo, con los días que tomó, y la reseña es solo una invitación.
 *  Se monta al abrirse. */
export function FinishBookSheet({ book, initialStartDate, onClose, onConfirm }: FinishBookSheetProps) {
  const [dates, setDates] = useState<ReadingDates>({ startDate: initialStartDate ?? '', endDate: todayLocalDate() })
  const [savingAction, setSavingAction] = useState<'done' | 'review' | null>(null)
  const isValid = readingDatesAreValid(dates)

  async function handleConfirm(writeReview: boolean) {
    if (!isValid) return
    setSavingAction(writeReview ? 'review' : 'done')
    await onConfirm(dates, writeReview)
    setSavingAction(null)
  }

  return (
    <Sheet
      onClose={onClose}
      title="¡Lo terminaste!"
      footer={
        <FormActions>
          <Button variant="soft" onClick={() => handleConfirm(true)} isLoading={savingAction === 'review'} disabled={!isValid || savingAction !== null}>
            <PenLine size={16} />
            Escribir reseña
          </Button>
          <Button variant="primary" onClick={() => handleConfirm(false)} isLoading={savingAction === 'done'} disabled={!isValid || savingAction !== null}>
            Listo
          </Button>
        </FormActions>
      }
    >
      <div className="animate-fade-in">
        <BookMiniHeader book={book} />
        <p className="text-body-md text-text-secondary mb-3.5">¿Cuándo lo leíste? Puedes cambiar las fechas después.</p>
        <ReadingDatesFields startDate={dates.startDate} endDate={dates.endDate} onChange={setDates} showDays className="mb-1" />
      </div>
    </Sheet>
  )
}
