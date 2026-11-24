import { useState } from 'react'
import { Sheet } from '../atoms/Sheet'
import { Button } from '../atoms/Button'
import { DateInput } from '../atoms/DateInput'
import { Input } from '../atoms/Input'
import { DurationMaskInput } from '../atoms/DurationMaskInput'
import { todayLocalDate } from '../../../lib/date'
import { parseDurationInput, secondsToTimeInput } from '../../../lib/duration'
import { formatLabel } from '../../../lib/tally'
import type { BookFormat } from '../../../lib/options'
import { BookMiniHeader, type MiniBook } from './BookMiniHeader'
import { FormatPicker } from './EditBookForm'
import { FormActions, FormCard, FormRow } from './FormLayout'

/** Lo que la hoja deja listo para guardar en el libro al empezar la lectura (V.4.6.0): el
 *  formato de esta lectura y, si se escribieron, las páginas o la duración del libro. */
export interface ReadingStartPatch {
  format: BookFormat
  total_pages?: number | null
  total_duration_seconds?: number | null
}

export type StartBook = MiniBook & {
  format?: string | null
  total_pages?: number | null
  total_duration_seconds?: number | null
}

interface StartReadingDateModalProps {
  isOpen: boolean
  book?: StartBook | null
  /** Relectura ("Leer de nuevo"): cambia el título y la pregunta. */
  isReread?: boolean
  /** Formato y año de la lectura anterior, para "La leíste en físico en 2025". */
  lastReading?: { format: string | null; year: number } | null
  /** Se guarda esa fecha como inicio de la lectura (hoy, o la que se eligió), con el formato. */
  onConfirm: (startDate: string, patch: ReadingStartPatch) => void
  /** "Ahora no": se guarda el cambio de estado y el formato, sin tocar la fecha de inicio. */
  onDismiss: (patch: ReadingStartPatch) => void
}

const FORMATS: BookFormat[] = ['fisico', 'digital', 'audiolibro']

function initialFormat(book: StartBook | null | undefined, last: { format: string | null } | null | undefined): BookFormat {
  const candidate = book?.format ?? last?.format
  return FORMATS.includes(candidate as BookFormat) ? (candidate as BookFormat) : 'fisico'
}

/** "¡A leer!": aparece al marcar un libro como Leyendo (Retomar lectura, Leer de nuevo, el
 *  menú de estado, Empezar a leer...) para poner la fecha de inicio. Arranca en hoy y se puede
 *  cambiar (V.2.2.0; antes solo preguntaba sí o no a usar hoy).
 *  V.4.6.0: el formato se elige aquí, en cada lectura, y no al agregar el libro. Debajo va un
 *  bloque con las páginas (físico y digital) o la duración (audiolibro), que se guardan en el
 *  libro; si el libro no las tiene, se piden ahí mismo. */
export function StartReadingDateModal(props: StartReadingDateModalProps) {
  if (!props.isOpen) return null
  return <StartReadingSheet {...props} />
}

function StartReadingSheet({ book, isReread, lastReading, onConfirm, onDismiss }: StartReadingDateModalProps) {
  const [startDate, setStartDate] = useState(() => todayLocalDate())
  const [format, setFormat] = useState<BookFormat>(() => initialFormat(book, lastReading))
  const [pages, setPages] = useState(() => (book?.total_pages ? String(book.total_pages) : ''))
  const [duration, setDuration] = useState(() => (book?.total_duration_seconds ? secondsToTimeInput(book.total_duration_seconds) : ''))
  const [isSaving, setIsSaving] = useState(false)

  const isAudio = format === 'audiolibro'
  const hasSaved = isAudio ? !!book?.total_duration_seconds : !!book?.total_pages

  function buildPatch(): ReadingStartPatch {
    const patch: ReadingStartPatch = { format }
    if (isAudio) {
      const seconds = parseDurationInput(duration)
      if (seconds && seconds !== book?.total_duration_seconds) patch.total_duration_seconds = seconds
    } else {
      const n = parseInt(pages, 10)
      if (!Number.isNaN(n) && n > 0 && n !== book?.total_pages) patch.total_pages = n
    }
    return patch
  }

  async function handleConfirm() {
    if (!startDate) return
    setIsSaving(true)
    await onConfirm(startDate, buildPatch())
    setIsSaving(false)
  }

  const lastLine = lastReading
    ? `La leíste ${lastReading.format ? `en ${formatLabel(lastReading.format)?.toLowerCase()} ` : ''}en ${lastReading.year}`
    : null

  return (
    <Sheet
      corta
      onClose={() => onDismiss(buildPatch())}
      title={isReread ? 'Leer de nuevo' : '¡A leer!'}
      footer={
        <FormActions>
          <Button variant="outline" onClick={() => onDismiss(buildPatch())}>Ahora no</Button>
          <Button variant="primary" onClick={handleConfirm} isLoading={isSaving} disabled={!startDate}>Guardar</Button>
        </FormActions>
      }
    >
      <div className="animate-fade-in">
        {book && <BookMiniHeader book={book} />}
        {lastLine && <p className="-mt-2 mb-3 text-body-sm text-text-muted">{lastLine}</p>}
        <p className="text-body-md text-text-secondary mb-3.5">
          {isReread
            ? '¿Desde cuándo y en qué formato lo estás leyendo esta vez?'
            : '¿Desde cuándo y en qué formato lo estás leyendo? Así tu racha, tu ritmo y tus estadísticas salen bien.'}
        </p>
        <FormCard className="mb-1">
          <FormRow label="Fecha de inicio">
            <DateInput bare value={startDate} max={todayLocalDate()} onChange={(e) => setStartDate(e.target.value)} />
          </FormRow>
          <div className="px-3.5 pt-2.5 pb-0.5">
            <p className="mb-2 font-body font-semibold text-body-md text-text-secondary">Formato</p>
            <FormatPicker value={format} onChange={setFormat} />
          </div>
          <div className="px-3.5 py-2.5 bg-primary-soft/40 rounded-b-[18px]">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="start-amount" className="font-body font-semibold text-body-md text-text-secondary">
                {isAudio ? 'Duración' : 'Páginas'}
              </label>
              {isAudio ? (
                <DurationMaskInput
                  bare
                  id="start-amount"
                  value={duration}
                  onChange={setDuration}
                  className="w-32! text-center font-display font-semibold text-[20px] tabular-nums border-b-[1.5px] border-primary-text"
                />
              ) : (
                <Input
                  bare
                  id="start-amount"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  placeholder="0"
                  value={pages}
                  onChange={(e) => setPages(e.target.value)}
                  className="w-28! text-center font-display font-semibold text-[20px] tabular-nums border-b-[1.5px] border-primary-text"
                />
              )}
            </div>
            <p className="mt-2 font-display italic text-body-md text-text-muted leading-snug">
              {hasSaved
                ? 'Si tu edición tiene otro número, cámbialo aquí. Queda guardado en el libro.'
                : isAudio
                  ? 'Este libro todavía no tiene la duración del audiolibro. Queda guardada en el libro.'
                  : 'Este libro todavía no tiene el número de páginas. Queda guardado en el libro.'}
            </p>
          </div>
        </FormCard>
      </div>
    </Sheet>
  )
}
