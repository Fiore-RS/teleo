import { useState } from 'react'
import { ImageOff } from 'lucide-react'
import { FormActions, FormCard, FormRow } from './FormLayout'
import { Sheet } from '../atoms/Sheet'
import { DetailSkeleton } from '../atoms/Skeleton'
import { CoverImage } from '../atoms/CoverImage'
import { useAuth } from '../../../hooks/useAuth'
import { useBook } from '../../../hooks/useBook'
import { getProgressInfo, progressPatch, progressUnitLabel, progressUnitOf, progressUnitsFor, type ProgressUnit } from '../../../lib/progress'
import { getReadingPace, paceSentence } from '../../../lib/readingPace'
import { parseDurationInput, secondsToTimeInput } from '../../../lib/duration'
import { recordBookCompletion } from '../../../lib/readingHistory'
import { ProgressBar } from '../atoms/ProgressBar'
import { Input } from '../atoms/Input'
import { Button } from '../atoms/Button'
import { AbandonarLibroModal } from './AbandonarLibroModal'
import { MissingStartDateModal } from './MissingStartDateModal'
import { FinishBookSheet } from './FinishBookSheet'
import { PauseBookSheet } from './PauseBookSheet'
import type { ReadingDates } from '../../../lib/readingDates'
import { DurationMaskInput } from '../atoms/DurationMaskInput'
import { Resena } from '../../../pages/Resena'
import { AddQuoteSheet } from './AddQuoteSheet'
import { useQuotes } from '../../../hooks/useQuotes'
import { useQueryClient } from '@tanstack/react-query'
import { useUserCustomMoods } from '../../../hooks/useUserCustomMoods'
import { traitsFromBook, traitsToColumns, type BookTraits } from '../../../lib/bookTraits'
import { useSaga } from '../../../hooks/useSaga'
import { advanceNextInSaga, findNextInSaga, type NextInSaga } from '../../../lib/nextInSaga'

interface UpdateProgressModalProps {
  bookId: string
  onClose: () => void
  onUpdated: () => void
}

export function UpdateProgressModal({ bookId, onClose, onUpdated }: UpdateProgressModalProps) {
  const { user } = useAuth()
  const { book, updateBook } = useBook(bookId)
  const queryClient = useQueryClient()
  const knownCustomMoods = useUserCustomMoods(user?.id)
  const bookTraits = traitsFromBook(book)
  // Para "Sigue en la saga" al terminar (V.3.1.0).
  const { saga, books: sagaBooks } = useSaga(book?.saga_id ?? undefined)
  const [value, setValue] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isAbandonOpen, setIsAbandonOpen] = useState(false)
  const [isPauseOpen, setIsPauseOpen] = useState(false)
  const [isFinishOpen, setIsFinishOpen] = useState(false)
  const [isReviewOpen, setIsReviewOpen] = useState(false)
  const [isAddingQuote, setIsAddingQuote] = useState(false)
  const { addQuote } = useQuotes(user?.id)
  const [error, setError] = useState<string | null>(null)
  // Se descarta (ignora) el aviso de fecha de inicio faltante localmente, sin tocar la base
  // de datos, para que no vuelva a aparecer mientras este modal siga abierto.
  const [startDatePromptIgnored, setStartDatePromptIgnored] = useState(false)

  // V.4.6.0: unidad del progreso (páginas, tiempo o porcentaje), según el formato de esta
  // lectura y la última que se eligió en el libro.
  const units: ProgressUnit[] = book ? progressUnitsFor(book) : []
  const savedUnit: ProgressUnit | null = book ? progressUnitOf(book) : null
  const [unit, setUnit] = useState<ProgressUnit | null>(null)
  const activeUnit = unit ?? savedUnit
  const isTime = activeUnit === 'tiempo'
  const isPercent = activeUnit === 'porcentaje'
  const showMissingStartDatePrompt = !!book && book.status === 'leyendo' && !book.start_date && !startDatePromptIgnored

  // El campo arranca con el progreso guardado y se vuelve a llenar solo cuando ese progreso
  // cambia (al abrir o después de guardar). Se ajusta durante el render en vez de en un efecto,
  // así no hay un render extra ni se borra lo que se está escribiendo si el libro se recarga
  // por otra cosa (por ejemplo, al poner la fecha de inicio).
  const savedValue = !book || !savedUnit ? null : valueIn(book, savedUnit)
  const [filledFrom, setFilledFrom] = useState<string | null>(null)
  if (savedValue !== null && savedValue !== filledFrom) {
    setFilledFrom(savedValue)
    setValue(savedValue)
    setUnit(null)
  }

  /** Lo que se escribió, como número en la unidad activa (null si todavía no se entiende). */
  function parseTyped(text: string): number | null {
    if (isTime) return parseDurationInput(text)
    const n = Number.parseFloat(text.replace(',', '.'))
    return Number.isNaN(n) || n < 0 ? null : n
  }

  // Cambiar de unidad pasa lo escrito a la otra unidad (con el total de páginas o la duración),
  // así no se pierde el avance.
  function handleUnitChange(next: ProgressUnit) {
    if (!book || !activeUnit || next === activeUnit) return
    const typedNow = parseTyped(value)
    const base = typedNow !== null ? { ...book, ...progressPatch(book, activeUnit, typedNow) } : book
    setUnit(next)
    setValue(valueIn(base, next))
    setError(null)
  }

  async function handleUpdate() {
    if (!book) return
    setError(null)

    if (!activeUnit) return
    const typedValue = parseTyped(value)
    if (isTime && typedValue === null) { setError('Formato inválido, usa hh:mm:ss'); return }
    if (isPercent && (typedValue === null || typedValue > 100)) { setError('Ingresa un porcentaje entre 0 y 100'); return }
    if (activeUnit === 'paginas' && (typedValue === null || !Number.isInteger(typedValue))) { setError('Ingresa un número válido de páginas'); return }
    setIsSaving(true)
    await updateBook(progressPatch(book, activeUnit, typedValue!))

    setIsSaving(false)
    onUpdated()
    // Desde la V.2.2.0 la hoja se cierra al guardar: la barra ya mostró el cambio al escribir.
    onClose()
  }

  // Terminar un libro: se eligen las fechas en FinishBookSheet, después "¿Cómo fue?" (V.3.1.0)
  // y la reseña es opcional.
  async function handleFinishConfirm(dates: ReadingDates) {
    const startDate = dates.startDate || null
    const endDate = dates.endDate || null
    await updateBook({ status: 'terminado', start_date: startDate, end_date: endDate })
    // Se guarda esta lectura en el historial (primera vez o relectura) para que el reto anual,
    // "Mis años en libros" y el Resumen la cuenten en el año de la fecha de fin.
    await recordBookCompletion({ bookId, userId: user?.id, startDate, endDate, format: book?.format ?? null })
    onUpdated()
  }

  async function handleSaveTraits(traits: BookTraits) {
    await updateBook(traitsToColumns(traits, bookTraits))
    void queryClient.invalidateQueries({ queryKey: ['userCustomMoods'] })
  }

  async function handleAdvanceNext(next: NextInSaga) {
    await advanceNextInSaga(next, book?.format ?? null)
    void queryClient.invalidateQueries()
  }

  function handleFinishDone(writeReview: boolean) {
    setIsFinishOpen(false)
    if (writeReview) setIsReviewOpen(true)
    else onClose()
  }

  function handleReviewClose() {
    setIsReviewOpen(false)
    onClose()
  }

  // En pausa (V.3.1.0): el progreso queda guardado y el libro sale de Leyendo ahora.
  async function handlePauseConfirm(reason: string) {
    await updateBook({ status: 'pausado', pause_reason: reason || null })
    setIsPauseOpen(false)
    onUpdated()
    onClose()
  }

  async function handleAbandonConfirm(data: { abandon_reason: string; start_date: string; end_date: string }) {
    await updateBook({ status: 'abandonado', ...data })
    setIsAbandonOpen(false)
    onUpdated()
    onClose()
  }

  async function handleSetMissingStartDate(startDate: string) {
    await updateBook({ start_date: startDate })
    onUpdated()
  }

  // Vista previa en vivo: la barra y lo que falta se calculan con lo que se está escribiendo,
  // antes de guardar. Si el valor no se entiende todavía, se usa el guardado.
  const typed = book ? parseTyped(value) : null
  const preview = book && activeUnit
    ? { ...book, ...(typed !== null ? progressPatch(book, activeUnit, isPercent ? Math.min(typed, 100) : typed) : { progress_unit: activeUnit }) }
    : null
  const percent = preview ? Math.min(100, Math.max(0, getProgressInfo(preview).percent)) : 0

  let remaining: string | null = null
  if (preview) {
    if (isTime && preview.total_duration_seconds) {
      const left = Math.max(0, preview.total_duration_seconds - (preview.current_duration_seconds ?? 0))
      const h = Math.floor(left / 3600)
      const m = Math.floor((left % 3600) / 60)
      remaining = left === 0 ? 'Ya lo terminaste' : `Te faltan ${h > 0 ? `${h} h ` : ''}${m} min`
    } else if (isPercent) {
      const left = Math.round((100 - (preview.progress_percent ?? 0)) * 10) / 10
      remaining = left <= 0 ? 'Ya lo terminaste' : `Te falta ${String(left).replace('.', ',')} %`
    } else if (preview.total_pages) {
      const left = Math.max(0, preview.total_pages - (preview.current_page ?? 0))
      remaining = left === 0 ? 'Ya lo terminaste' : `Te ${left === 1 ? 'falta 1 pág.' : `faltan ${left} págs.`}`
    }
  }

  const pace = book ? getReadingPace(book) : null
  const hasChanges = savedValue !== null && (value.trim() !== savedValue || (unit !== null && unit !== savedUnit))

  let totalLabel: string | null = null
  if (book) {
    if (isTime) totalLabel = book.total_duration_seconds ? `de ${secondsToTimeInput(book.total_duration_seconds)}` : null
    else if (isPercent) totalLabel = '%'
    else totalLabel = book.total_pages ? `de ${book.total_pages}` : null
  }
  const fieldLabel = isTime ? 'Tiempo escuchado' : isPercent ? 'Porcentaje leído' : 'Página actual'
  const field = isTime ? (
    <DurationMaskInput
      bare
      id="progress-value"
      value={value}
      onChange={setValue}
      className="w-32! text-center font-display font-semibold text-[22px] tabular-nums border-b-[1.5px] border-border focus:border-primary-text"
    />
  ) : (
    <Input
      bare
      id="progress-value"
      type="number"
      inputMode={isPercent ? 'decimal' : 'numeric'}
      min={0}
      max={isPercent ? 100 : undefined}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      className="w-18! text-center font-display font-semibold text-[22px] tabular-nums border-b-[1.5px] border-border focus:border-primary-text"
    />
  )

  return (
    <>
      <Sheet
        corta
        onClose={onClose}
        title="Actualizar progreso"
        footer={book ? (
          <FormActions>
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button variant="primary" onClick={handleUpdate} disabled={!hasChanges} isLoading={isSaving}>Guardar</Button>
          </FormActions>
        ) : undefined}
      >
        {!book ? <DetailSkeleton /> : (
          <div className="animate-fade-in">
            <div className="flex gap-3.5 items-center mb-3.5">
              <div className="relative aspect-2/3 w-14 shrink-0 rounded-[9px] overflow-hidden bg-surface-2 shadow-[0_8px_18px_-10px_rgba(60,30,10,0.55)]">
                {book.cover_url ? (
                  <CoverImage src={book.cover_url ?? undefined} alt={book.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><ImageOff size={16} className="text-text-secondary" /></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display font-semibold text-[18px] leading-tight text-text line-clamp-2">{book.title}</h3>
                {book.author && <p className="text-body-md text-text-secondary mt-0.5 truncate">{book.author}</p>}
                <div className="flex justify-between gap-2 text-body-sm text-text-secondary mt-2 mb-1.5 tabular-nums">
                  {remaining && <span>{remaining}</span>}
                  <span className="ml-auto font-bold text-primary-text">{Math.round(percent)} %</span>
                </div>
                <ProgressBar percent={percent} />
              </div>
            </div>

            <FormCard>
              {units.length > 1 ? (
                // V.4.6.0 (opción 1 del lienzo): la unidad arriba, de lado a lado, y la cifra
                // centrada con su total. Así no queda espacio vacío entre la etiqueta y el campo.
                <div className="px-3 pt-3 pb-3.5">
                  <UnitPicker units={units} value={activeUnit!} onChange={handleUnitChange} />
                  <div className="flex items-baseline justify-center gap-2 mt-3">
                    <label htmlFor="progress-value" className="sr-only">{fieldLabel}</label>
                    {field}
                    {totalLabel && <span className="text-body-md text-text-muted whitespace-nowrap">{totalLabel}</span>}
                  </div>
                </div>
              ) : (
                <FormRow label={fieldLabel} htmlFor="progress-value">
                  <span className="flex items-baseline justify-end gap-1.5">
                    {field}
                    {totalLabel && <span className="text-body-md text-text-muted whitespace-nowrap">{totalLabel}</span>}
                  </span>
                </FormRow>
              )}
            </FormCard>
            {error && <p className="text-body-sm text-primary-text mt-2 animate-fade-in">{error}</p>}
            {pace && (
              <p className="text-body-sm text-text-muted mt-2 px-0.5 leading-snug">
                {paceSentence(pace)} · {pace.perDayLabel}
              </p>
            )}

            {/* 2 × 2 desde la V.3.1.0 (con Pausar, cuatro botones no caben en una fila). */}
            <div className="grid grid-cols-2 gap-1.5 mt-3.5 mb-1">
              <Button variant="soft" size="sm" className="px-2!" onClick={() => setIsAddingQuote(true)}>
                Cita
              </Button>
              <Button variant="magenta" size="sm" className="px-2!" onClick={() => setIsFinishOpen(true)}>
                Terminado
              </Button>
              <Button variant="outline" size="sm" className="px-2! text-text-secondary!" onClick={() => setIsPauseOpen(true)}>
                Pausar
              </Button>
              <Button variant="outline" size="sm" className="px-2! text-text-secondary!" onClick={() => setIsAbandonOpen(true)}>
                Abandonar
              </Button>
            </div>
          </div>
        )}
      </Sheet>

      {book && (
        <AbandonarLibroModal
          isOpen={isAbandonOpen}
          onClose={() => setIsAbandonOpen(false)}
          book={book}
          initialStartDate={book.start_date ?? ''}
          onConfirm={handleAbandonConfirm}
        />
      )}

      <MissingStartDateModal
        isOpen={showMissingStartDatePrompt}
        book={book}
        onConfirm={handleSetMissingStartDate}
        onIgnore={() => setStartDatePromptIgnored(true)}
      />

      {isPauseOpen && book && (
        <PauseBookSheet book={book} onClose={() => setIsPauseOpen(false)} onConfirm={handlePauseConfirm} />
      )}

      {isFinishOpen && book && (
        <FinishBookSheet
          book={book}
          initialStartDate={book.start_date}
          traits={bookTraits}
          knownCustomMoods={knownCustomMoods}
          onClose={() => setIsFinishOpen(false)}
          onConfirm={handleFinishConfirm}
          onSaveTraits={handleSaveTraits}
          onDone={handleFinishDone}
          nextInSaga={findNextInSaga(bookId, saga, sagaBooks)}
          onAdvanceNext={handleAdvanceNext}
        />
      )}

      {isAddingQuote && book && (
        <AddQuoteSheet
          userId={user?.id}
          initialBook={{ id: book.id, title: book.title, author: book.author, cover_url: book.cover_url, status: book.status }}
          // Si el progreso va en páginas, arranca con la página escrita arriba (aunque aún no se guarde).
          initialPage={activeUnit === 'paginas' ? Number.parseInt(value, 10) || null : null}
          onClose={() => setIsAddingQuote(false)}
          onSave={addQuote}
        />
      )}

      {isReviewOpen && <Resena bookId={bookId} onClose={handleReviewClose} />}
    </>
  )
}
/** Texto del campo en una unidad, con el progreso guardado (o el que se está escribiendo). */
function valueIn(
  book: { current_page: number | null; current_duration_seconds: number | null; progress_percent: number | null },
  unit: ProgressUnit
): string {
  if (unit === 'tiempo') return secondsToTimeInput(book.current_duration_seconds ?? 0)
  if (unit === 'porcentaje') return String(Math.round((book.progress_percent ?? 0) * 10) / 10)
  return String(book.current_page ?? 0)
}

/** Selector de unidad (V.4.6.0): Páginas | Porcentaje o Tiempo | Porcentaje, de lado a lado. */
function UnitPicker({ units, value, onChange }: { units: ProgressUnit[]; value: ProgressUnit; onChange: (unit: ProgressUnit) => void }) {
  return (
    <div role="radiogroup" aria-label="Unidad del progreso" className="grid grid-cols-2 gap-1 p-1 bg-surface border border-border rounded-field">
      {units.map((u) => {
        const isActive = u === value
        return (
          <button
            key={u}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(u)}
            className={`py-2 px-1 rounded-[6px] font-body font-bold text-body-md transition-all duration-150 ${
              isActive ? 'bg-surface-2 text-primary-text shadow-card' : 'text-text-secondary'
            }`}
          >
            {progressUnitLabel[u]}
          </button>
        )
      })}
    </div>
  )
}
