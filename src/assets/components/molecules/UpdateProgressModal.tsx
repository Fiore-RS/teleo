import { useState } from 'react'
import { ImageOff, Check, Flag, Quote } from 'lucide-react'
import { FormActions, FormCard, FormRow } from './FormLayout'
import { Sheet } from '../atoms/Sheet'
import { DetailSkeleton } from '../atoms/Skeleton'
import { CoverImage } from '../atoms/CoverImage'
import { useAuth } from '../../../hooks/useAuth'
import { useBook } from '../../../hooks/useBook'
import { getProgressInfo } from '../../../lib/progress'
import { getReadingPace, paceSentence } from '../../../lib/readingPace'
import { parseDurationInput, secondsToTimeInput } from '../../../lib/duration'
import { recordBookCompletion } from '../../../lib/readingHistory'
import { ProgressBar } from '../atoms/ProgressBar'
import { Input } from '../atoms/Input'
import { Button } from '../atoms/Button'
import { AbandonarLibroModal } from './AbandonarLibroModal'
import { MissingStartDateModal } from './MissingStartDateModal'
import { FinishBookSheet } from './FinishBookSheet'
import type { ReadingDates } from '../../../lib/readingDates'
import { DurationMaskInput } from '../atoms/DurationMaskInput'
import { Resena } from '../../../pages/Resena'
import { AddQuoteSheet } from './AddQuoteSheet'
import { useQuotes } from '../../../hooks/useQuotes'

interface UpdateProgressModalProps {
  bookId: string
  onClose: () => void
  onUpdated: () => void
}

export function UpdateProgressModal({ bookId, onClose, onUpdated }: UpdateProgressModalProps) {
  const { user } = useAuth()
  const { book, updateBook } = useBook(bookId)
  const [value, setValue] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isAbandonOpen, setIsAbandonOpen] = useState(false)
  const [isFinishOpen, setIsFinishOpen] = useState(false)
  const [isReviewOpen, setIsReviewOpen] = useState(false)
  const [isAddingQuote, setIsAddingQuote] = useState(false)
  const { addQuote } = useQuotes(user?.id)
  const [error, setError] = useState<string | null>(null)
  // Se descarta (ignora) el aviso de fecha de inicio faltante localmente, sin tocar la base
  // de datos, para que no vuelva a aparecer mientras este modal siga abierto.
  const [startDatePromptIgnored, setStartDatePromptIgnored] = useState(false)

  const isAudio = book?.format === 'audiolibro'
  const isDigital = book?.format === 'digital'
  const showMissingStartDatePrompt = !!book && book.status === 'leyendo' && !book.start_date && !startDatePromptIgnored

  // El campo arranca con el progreso guardado y se vuelve a llenar solo cuando ese progreso
  // cambia (al abrir o después de guardar). Se ajusta durante el render en vez de en un efecto,
  // así no hay un render extra ni se borra lo que se está escribiendo si el libro se recarga
  // por otra cosa (por ejemplo, al poner la fecha de inicio).
  const savedValue = !book
    ? null
    : isAudio
      ? secondsToTimeInput(book.current_duration_seconds ?? 0)
      : isDigital
        ? String(book.progress_percent ?? 0)
        : String(book.current_page ?? 0)
  const [filledFrom, setFilledFrom] = useState<string | null>(null)
  if (savedValue !== null && savedValue !== filledFrom) {
    setFilledFrom(savedValue)
    setValue(savedValue)
  }

  async function handleUpdate() {
    if (!book) return
    setError(null)

    if (isAudio) {
      const seconds = parseDurationInput(value)
      if (seconds === null) { setError('Formato inválido, usa hh:mm:ss'); return }
      setIsSaving(true)
      await updateBook({ current_duration_seconds: seconds })
    } else if (isDigital) {
      const percent = parseInt(value, 10)
      if (isNaN(percent) || percent < 0 || percent > 100) { setError('Ingresa un porcentaje entre 0 y 100'); return }
      setIsSaving(true)
      await updateBook({ progress_percent: percent })
    } else {
      const pages = parseInt(value, 10)
      if (isNaN(pages) || pages < 0) { setError('Ingresa un número válido de páginas'); return }
      setIsSaving(true)
      await updateBook({ current_page: pages })
    }

    setIsSaving(false)
    onUpdated()
    // Desde la V.2.2.0 la hoja se cierra al guardar: la barra ya mostró el cambio al escribir.
    onClose()
  }

  // Terminar un libro: se eligen las fechas en FinishBookSheet y la reseña es opcional.
  async function handleFinishConfirm(dates: ReadingDates, writeReview: boolean) {
    const startDate = dates.startDate || null
    const endDate = dates.endDate || null
    await updateBook({ status: 'terminado', start_date: startDate, end_date: endDate })
    // Se guarda esta lectura en el historial (primera vez o relectura) para que el reto anual,
    // "Mis años en libros" y el Resumen la cuenten en el año de la fecha de fin.
    await recordBookCompletion({ bookId, userId: user?.id, startDate, endDate })
    onUpdated()
    setIsFinishOpen(false)
    if (writeReview) setIsReviewOpen(true)
    else onClose()
  }

  function handleReviewClose() {
    setIsReviewOpen(false)
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
  const typed = !book
    ? null
    : isAudio
      ? parseDurationInput(value)
      : Number.parseInt(value, 10)
  const typedValid = typed !== null && !Number.isNaN(typed) && typed >= 0
  const preview = book
    ? {
        ...book,
        ...(typedValid
          ? isAudio
            ? { current_duration_seconds: typed }
            : isDigital
              ? { progress_percent: Math.min(typed, 100) }
              : { current_page: typed }
          : {}),
      }
    : null
  const percent = preview ? Math.min(100, Math.max(0, getProgressInfo(preview).percent)) : 0

  let remaining: string | null = null
  if (preview) {
    if (isAudio && preview.total_duration_seconds) {
      const left = Math.max(0, preview.total_duration_seconds - (preview.current_duration_seconds ?? 0))
      const h = Math.floor(left / 3600)
      const m = Math.floor((left % 3600) / 60)
      remaining = left === 0 ? 'Ya lo terminaste' : `Te faltan ${h > 0 ? `${h} h ` : ''}${m} min`
    } else if (isDigital) {
      const left = 100 - (preview.progress_percent ?? 0)
      remaining = left <= 0 ? 'Ya lo terminaste' : `Te falta ${left} %`
    } else if (preview.total_pages) {
      const left = Math.max(0, preview.total_pages - (preview.current_page ?? 0))
      remaining = left === 0 ? 'Ya lo terminaste' : `Te ${left === 1 ? 'falta 1 pág.' : `faltan ${left} págs.`}`
    }
  }

  const pace = book ? getReadingPace(book) : null
  const hasChanges = savedValue !== null && value.trim() !== savedValue

  let totalLabel: string | null = null
  if (book) {
    if (isAudio) totalLabel = book.total_duration_seconds ? `de ${secondsToTimeInput(book.total_duration_seconds)}` : null
    else if (isDigital) totalLabel = '%'
    else totalLabel = book.total_pages ? `de ${book.total_pages}` : null
  }

  return (
    <>
      <Sheet
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
              <FormRow label={isAudio ? 'Tiempo escuchado' : isDigital ? 'Porcentaje leído' : 'Página actual'} htmlFor="progress-value">
                <span className="flex items-baseline justify-end gap-1.5">
                  {isAudio ? (
                    <DurationMaskInput
                      bare
                      value={value}
                      onChange={setValue}
                      className="w-28! text-center font-display font-semibold text-[22px] tabular-nums border-b-[1.5px] border-border focus:border-primary-text"
                    />
                  ) : (
                    <Input
                      bare
                      id="progress-value"
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={isDigital ? 100 : undefined}
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      className="w-18! text-center font-display font-semibold text-[22px] tabular-nums border-b-[1.5px] border-border focus:border-primary-text"
                    />
                  )}
                  {totalLabel && <span className="text-body-md text-text-muted whitespace-nowrap">{totalLabel}</span>}
                </span>
              </FormRow>
            </FormCard>
            {error && <p className="text-body-sm text-primary-text mt-2 animate-fade-in">{error}</p>}
            {pace && (
              <p className="text-body-sm text-text-muted mt-2 px-0.5 leading-snug">
                {paceSentence(pace)} · {pace.perDayLabel}
              </p>
            )}

            <div className="flex gap-1.5 mt-3.5 mb-1">
              <Button variant="soft" size="sm" className="px-2!" onClick={() => setIsAddingQuote(true)}>
                <Quote size={14} strokeWidth={2.4} />
                Cita
              </Button>
              <Button variant="magenta" size="sm" className="px-2!" onClick={() => setIsFinishOpen(true)}>
                <Check size={14} strokeWidth={2.8} />
                Terminado
              </Button>
              <Button variant="outline" size="sm" className="px-2! text-text-secondary!" onClick={() => setIsAbandonOpen(true)}>
                <Flag size={13} strokeWidth={2.4} />
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

      {isFinishOpen && book && (
        <FinishBookSheet
          book={book}
          initialStartDate={book.start_date}
          onClose={() => setIsFinishOpen(false)}
          onConfirm={handleFinishConfirm}
        />
      )}

      {isAddingQuote && book && (
        <AddQuoteSheet
          userId={user?.id}
          initialBook={{ id: book.id, title: book.title, author: book.author, cover_url: book.cover_url, status: book.status }}
          // En libros de papel arranca con la página escrita arriba (aunque aún no se guarde).
          initialPage={!isAudio && !isDigital ? Number.parseInt(value, 10) || null : null}
          onClose={() => setIsAddingQuote(false)}
          onSave={addQuote}
        />
      )}

      {isReviewOpen && <Resena bookId={bookId} onClose={handleReviewClose} />}
    </>
  )
}