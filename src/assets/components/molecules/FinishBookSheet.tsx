import { useState } from 'react'
import { Check, PenLine } from 'lucide-react'
import { Sheet } from '../atoms/Sheet'
import { Button } from '../atoms/Button'
import { todayLocalDate } from '../../../lib/date'
import { ReadingDatesFields } from './ReadingDatesFields'
import { BookMiniHeader, type MiniBook } from './BookMiniHeader'
import { BookTraitsFields } from './BookTraitsFields'
import { FormActions, FormSection } from './FormLayout'
import { readingDatesAreValid, type ReadingDates } from '../../../lib/readingDates'
import { hasMoodAndPace, type BookTraits } from '../../../lib/bookTraits'
import type { NextInSaga } from '../../../lib/nextInSaga'

interface FinishBookSheetProps {
  book: MiniBook
  initialStartDate: string | null
  /** Rasgos que el libro ya tiene: si tiene género, ánimo y ritmo, no se pide el segundo paso. */
  traits: BookTraits
  /** Ánimos propios que la persona ya usó (useUserCustomMoods). */
  knownCustomMoods: string[]
  /** Cierra sin terminar el libro (solo en el primer paso). */
  onClose: () => void
  /** Guarda el libro como terminado con esas fechas (primer paso). */
  onConfirm: (dates: ReadingDates) => Promise<void>
  /** Guarda ánimo, ritmo y, si faltaba, género (segundo paso, opcional). */
  onSaveTraits: (traits: BookTraits) => Promise<void>
  /** Fin del flujo; el libro ya quedó terminado. `writeReview` indica si se abre la reseña. */
  onDone: (writeReview: boolean) => void
  /** Siguiente libro de la saga en pendientes o deseados (findNextInSaga), si hay. */
  nextInSaga?: NextInSaga | null
  /** Empieza el siguiente libro (pendiente) o lo pasa a pendientes (deseado). */
  onAdvanceNext?: (next: NextInSaga) => Promise<void>
}

/** "¡Lo terminaste!" (fase 2.6, rediseñada en la V.2.2.0). V.3.1.0: dos pasos en la misma
 *  hoja, para que no se sienta larga. 1) Las fechas: al tocar "Listo" o "Escribir reseña" el
 *  libro ya queda terminado. 2) "¿Cómo fue?": ánimo, ritmo y género si faltaba, y "Sigue en la
 *  saga" si el siguiente libro está en pendientes o deseados; se puede omitir. Si no hay nada
 *  que pedir ni proponer, el segundo paso no aparece. Se monta al abrirse. */
export function FinishBookSheet({
  book,
  initialStartDate,
  traits,
  knownCustomMoods,
  onClose,
  onConfirm,
  onSaveTraits,
  onDone,
  nextInSaga = null,
  onAdvanceNext,
}: FinishBookSheetProps) {
  const [dates, setDates] = useState<ReadingDates>({ startDate: initialStartDate ?? '', endDate: todayLocalDate() })
  const [savingAction, setSavingAction] = useState<'done' | 'review' | 'traits' | null>(null)
  const [step, setStep] = useState<1 | 2>(1)
  const [writeReview, setWriteReview] = useState(false)
  const [draftTraits, setDraftTraits] = useState<BookTraits>(traits)
  // Se decide al abrir: con género, ánimo y ritmo ya puestos, no hay segundo paso.
  const [needsTraits] = useState(() => !(hasMoodAndPace(traits) && traits.genres.length > 0))
  const [showGenres] = useState(() => traits.genres.length === 0)
  // El siguiente de la saga se fija al abrir (no cambia aunque los datos se refresquen).
  const [next] = useState(() => (onAdvanceNext ? nextInSaga : null))
  const [nextState, setNextState] = useState<'idle' | 'saving' | 'done'>('idle')
  const hasStep2 = needsTraits || next !== null
  const isValid = readingDatesAreValid(dates)

  async function handleConfirm(review: boolean) {
    if (!isValid) return
    setSavingAction(review ? 'review' : 'done')
    await onConfirm(dates)
    setSavingAction(null)
    if (hasStep2) {
      setWriteReview(review)
      setStep(2)
    } else {
      onDone(review)
    }
  }

  async function handleSaveTraits() {
    setSavingAction('traits')
    await onSaveTraits(draftTraits)
    setSavingAction(null)
    onDone(writeReview)
  }

  async function handleAdvanceNext() {
    if (!next || !onAdvanceNext || nextState !== 'idle') return
    setNextState('saving')
    await onAdvanceNext(next)
    setNextState('done')
  }

  const nextCard = next && (
    <FormSection label="Sigue en la saga" className="mb-1">
      <div className="bg-surface-2 border border-border rounded-[18px] px-3.5 pt-3.5">
        <BookMiniHeader
          book={next}
          className="mb-3.5!"
          action={
            nextState === 'done' ? (
              <span className="inline-flex items-center gap-1 shrink-0 text-body-sm font-bold text-primary-text animate-fade-in">
                <Check size={14} strokeWidth={3} />
                {next.status === 'pendiente' ? 'Leyendo' : 'En pendientes'}
              </span>
            ) : (
              <Button variant="soft" size="sm" fullWidth={false} className="shrink-0 px-3!" onClick={handleAdvanceNext} isLoading={nextState === 'saving'}>
                {next.status === 'pendiente' ? 'Empezar a leerlo' : 'Pasar a pendientes'}
              </Button>
            )
          }
        />
        <p className="-mt-2 mb-3 text-body-sm text-text-muted">
          {next.sagaTitle} · Libro {next.position} · {next.status === 'pendiente' ? 'Pendiente' : 'Deseado'}
        </p>
      </div>
    </FormSection>
  )

  const steps = hasStep2 && (
    <div className="flex gap-1.5 mb-3.5" aria-label={`Paso ${step} de 2`}>
      <span className="h-1 flex-1 rounded-full bg-primary" />
      <span className={`h-1 flex-1 rounded-full transition-colors ${step === 2 ? 'bg-primary' : 'bg-border'}`} />
    </div>
  )

  if (step === 2) {
    return (
      <Sheet
        // El libro ya quedó terminado: cerrar es lo mismo que omitir.
        onClose={() => onDone(writeReview)}
        title={needsTraits ? '¿Cómo fue?' : 'Sigue en la saga'}
        footer={
          needsTraits ? (
            <FormActions>
              <Button variant="outline" onClick={() => onDone(writeReview)} disabled={savingAction !== null}>
                Omitir
              </Button>
              <Button variant="primary" onClick={handleSaveTraits} isLoading={savingAction === 'traits'} disabled={savingAction !== null}>
                Guardar
              </Button>
            </FormActions>
          ) : (
            <FormActions>
              <Button variant="primary" onClick={() => onDone(writeReview)}>Listo</Button>
            </FormActions>
          )
        }
      >
        <div key="traits" className="animate-fade-in">
          {steps}
          {needsTraits && (
            <>
              <p className="text-body-md text-text-secondary mb-4">Opcional. Te ayuda a encontrar libros parecidos y a ver tus estadísticas.</p>
              <BookTraitsFields value={draftTraits} onChange={setDraftTraits} knownCustomMoods={knownCustomMoods} showGenres={showGenres} className="mb-5.5" />
            </>
          )}
          {nextCard}
        </div>
      </Sheet>
    )
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
      <div key="dates" className="animate-fade-in">
        {steps}
        <BookMiniHeader book={book} />
        <p className="text-body-md text-text-secondary mb-3.5">¿Cuándo lo leíste? Puedes cambiar las fechas después.</p>
        <ReadingDatesFields startDate={dates.startDate} endDate={dates.endDate} onChange={setDates} showDays className="mb-1" />
      </div>
    </Sheet>
  )
}
