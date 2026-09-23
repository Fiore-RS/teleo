import { useEffect, useState } from 'react'
import { ImageOff, Check, Flag } from 'lucide-react'
import { Sheet } from '../atoms/Sheet'
import { DetailSkeleton } from '../atoms/Skeleton'
import { CoverImage } from '../atoms/CoverImage'
import { useAuth } from '../../../hooks/useAuth'
import { useBook } from '../../../hooks/useBook'
import { getProgressInfo } from '../../../lib/progress'
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
  const [error, setError] = useState<string | null>(null)
  // Se descarta (ignora) el aviso de fecha de inicio faltante localmente, sin tocar la base
  // de datos, para que no vuelva a aparecer mientras este modal siga abierto.
  const [startDatePromptIgnored, setStartDatePromptIgnored] = useState(false)

  const isAudio = book?.format === 'audiolibro'
  const isDigital = book?.format === 'digital'
  const showMissingStartDatePrompt = !!book && book.status === 'leyendo' && !book.start_date && !startDatePromptIgnored

  useEffect(() => {
    if (!book) return
    if (isAudio) setValue(secondsToTimeInput(book.current_duration_seconds ?? 0))
    else if (isDigital) setValue(String(book.progress_percent ?? 0))
    else setValue(String(book.current_page ?? 0))
  }, [book, isAudio, isDigital])

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

  return (
    <>
      <Sheet onClose={onClose} title="Actualizar progreso">
        {!book ? <DetailSkeleton /> : (
          <>
            <div className="flex gap-4 items-start">
              <div className="relative aspect-2/3 w-24 shrink-0 rounded-xl overflow-hidden bg-surface-2 shadow-[0_10px_24px_-12px_rgba(60,30,10,0.55)]">
                {book.cover_url ? (
                  <CoverImage src={book.cover_url ?? undefined} alt={book.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><ImageOff size={22} className="text-text-secondary" /></div>
                )}
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <h3 className="font-display font-semibold text-[20px] leading-tight text-text text-balance">{book.title}</h3>
                {book.author && <p className="text-body-md text-text-secondary mt-1">{book.author}</p>}

                {(() => {
                  const { percent } = getProgressInfo(book)

                  let comparisonLabel: string | null = null
                  if (isAudio && book.total_duration_seconds) {
                    comparisonLabel = `Hora ${secondsToTimeInput(book.current_duration_seconds ?? 0)} de ${secondsToTimeInput(book.total_duration_seconds)}`
                  } else if (isDigital) {
                    comparisonLabel = null
                  } else if (book.total_pages) {
                    comparisonLabel = `Pág. ${book.current_page ?? 0} de ${book.total_pages}`
                  }

                  return (
                    <div className="mt-3">
                      <div className="flex justify-between text-body-sm text-text-secondary mb-1.5 tabular-nums">
                        {comparisonLabel && <span>{comparisonLabel}</span>}
                        <span className="ml-auto font-semibold text-primary-text">{Math.round(percent)}%</span>
                      </div>
                      <ProgressBar percent={percent} />
                    </div>
                  )
                })()}
              </div>
            </div>

            <label className="font-body font-semibold text-body-sm text-text-secondary block mt-5 mb-1.5">
              {isAudio ? 'Tiempo escuchado' : isDigital ? 'Porcentaje leído' : 'Página actual'}
            </label>
            <div className="flex gap-2">
              {isAudio ? (
                <DurationMaskInput value={value} onChange={setValue} className="flex-1" />
              ) : (
                <Input
                  type="number"
                  inputMode="numeric"
                  min={isDigital ? 0 : undefined}
                  max={isDigital ? 100 : undefined}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={isDigital ? 'Porcentaje leído' : 'Página actual'}
                  className="flex-1"
                />
              )}
              <Button variant="primary" fullWidth={false} className="px-6!" onClick={handleUpdate} isLoading={isSaving}>
                Guardar
              </Button>
            </div>
            {error && <p className="text-body-sm text-primary-text mt-2">{error}</p>}

            <div className="flex flex-col gap-2.5 mt-6">
              <Button variant="magenta" onClick={() => setIsFinishOpen(true)}>
                <Check size={18} />
                Marcar como terminado
              </Button>
              <Button variant="outline" onClick={() => setIsAbandonOpen(true)}>
                <Flag size={17} />
                Abandonar
              </Button>
            </div>
          </>
        )}
      </Sheet>

      {book && (
        <AbandonarLibroModal
          isOpen={isAbandonOpen}
          onClose={() => setIsAbandonOpen(false)}
          bookTitle={book.title}
          initialStartDate={book.start_date ?? ''}
          onConfirm={handleAbandonConfirm}
        />
      )}

      <MissingStartDateModal
        isOpen={showMissingStartDatePrompt}
        onConfirm={handleSetMissingStartDate}
        onIgnore={() => setStartDatePromptIgnored(true)}
      />

      {isFinishOpen && book && (
        <FinishBookSheet
          bookTitle={book.title}
          initialStartDate={book.start_date}
          onClose={() => setIsFinishOpen(false)}
          onConfirm={handleFinishConfirm}
        />
      )}

      {isReviewOpen && <Resena bookId={bookId} onClose={handleReviewClose} />}
    </>
  )
}