import { useState } from 'react'
import { PenLine } from 'lucide-react'
import { Modal } from '../atoms/Modal'
import { Button } from '../atoms/Button'
import { todayLocalDate } from '../../../lib/date'
import { ReadingDatesFields } from './ReadingDatesFields'
import { readingDatesAreValid, type ReadingDates } from '../../../lib/readingDates'

interface FinishBookSheetProps {
  bookTitle: string
  initialStartDate: string | null
  onClose: () => void
  /** Guarda el libro como terminado con esas fechas. `writeReview` indica si después se abre
   *  la reseña. */
  onConfirm: (dates: ReadingDates, writeReview: boolean) => Promise<void>
}

/** "¡Lo terminaste!" (fase 2.6, feedback de las beta-testers): al marcar un libro como
 *  terminado se eligen las fechas ahí mismo, y la reseña es solo una invitación. Reemplaza al
 *  aviso anterior, que fijaba la fecha de fin en hoy sin preguntar y dejaba las fechas atadas
 *  a la reseña. Se monta al abrirse. */
export function FinishBookSheet({ bookTitle, initialStartDate, onClose, onConfirm }: FinishBookSheetProps) {
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
    <Modal isOpen onClose={onClose} title="¡Lo terminaste!">
      <p className="text-body-md text-text-secondary mb-4">
        ¿Cuándo leíste <span className="font-semibold text-text">{bookTitle}</span>? Puedes cambiar las fechas después.
      </p>
      <ReadingDatesFields startDate={dates.startDate} endDate={dates.endDate} onChange={setDates} />
      <div className="flex flex-col gap-2.5 mt-5">
        <Button variant="primary" onClick={() => handleConfirm(false)} isLoading={savingAction === 'done'} disabled={!isValid || savingAction !== null}>
          Listo
        </Button>
        <Button variant="soft" onClick={() => handleConfirm(true)} isLoading={savingAction === 'review'} disabled={!isValid || savingAction !== null}>
          <PenLine size={16} />
          Escribir reseña
        </Button>
      </div>
    </Modal>
  )
}
