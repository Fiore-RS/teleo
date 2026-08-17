import { useEffect, useState } from 'react'
import { ImageOff } from 'lucide-react'
import { CoverImage } from '../atoms/CoverImage'
import { useBook } from '../../../hooks/useBook'
import { getProgressInfo } from '../../../lib/progress'
import { parseDurationInput, secondsToTimeInput } from '../../../lib/duration'
import { ProgressBar } from '../atoms/ProgressBar'
import { Input } from '../atoms/Input'
import { Button } from '../atoms/Button'
import { AbandonarLibroModal } from './AbandonarLibroModal'
import { DurationMaskInput } from '../atoms/DurationMaskInput'

interface UpdateProgressModalProps {
  bookId: string
  onClose: () => void
  onUpdated: () => void
}

export function UpdateProgressModal({ bookId, onClose, onUpdated }: UpdateProgressModalProps) {
  const { book, updateBook, deleteBook } = useBook(bookId)
  const [value, setValue] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isAbandonOpen, setIsAbandonOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isAudio = book?.format === 'audiolibro'
  const isDigital = book?.format === 'digital'

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

  async function handleMarkFinished() {
    setIsSaving(true)
    await updateBook({ status: 'terminado', end_date: new Date().toISOString().slice(0, 10) })
    setIsSaving(false)
    onUpdated()
    onClose()
  }

  async function handleDelete() {
    const ok = await deleteBook()
    if (ok) { onUpdated(); onClose() }
  }

  async function handleAbandonConfirm(data: { abandon_reason: string; start_date: string; end_date: string }) {
    await updateBook({ status: 'abandonado', ...data })
    setIsAbandonOpen(false)
    onUpdated()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6" onClick={onClose}>
      <div className="w-full max-w-sm bg-surface rounded-3xl p-6 max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {!book ? (
          <p className="text-center text-text-secondary py-10">Cargando...</p>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display italic text-display-md text-accent-wishlist">Actualizar progreso</h2>
              <button onClick={onClose} aria-label="Cerrar" className="text-text-secondary">✕</button>
            </div>

            <div className="relative aspect-2/3 w-32 mx-auto rounded-xl overflow-hidden bg-border mb-4">
              {book.cover_url ? (
                <CoverImage src={book.cover_url ?? undefined} alt={book.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><ImageOff size={24} className="text-text-secondary" /></div>
              )}
            </div>

            <h3 className="font-display italic text-display-md text-accent-wishlist text-center">{book.title}</h3>
            <p className="text-body-md text-text-secondary text-center mt-1">{book.author}</p>

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
                <div className="mt-4">
                  <div className="flex justify-between text-body-sm text-text-secondary mb-1">
                    {comparisonLabel && <span>{comparisonLabel}</span>}
                    <span className="ml-auto">{Math.round(percent)}%</span>
                  </div>
                  <ProgressBar percent={percent} />
                </div>
              )
            })()}

            <div className="flex gap-2 mt-4">
              {isAudio ? (
                <DurationMaskInput value={value} onChange={setValue} className="flex-1" />
              ) : (
                <Input
                  type="number"
                  min={isDigital ? 0 : undefined}
                  max={isDigital ? 100 : undefined}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={isDigital ? 'Porcentaje leído' : 'Página actual'}
                  className="flex-1"
                />
              )}
              <Button variant="primary" className="w-auto! px-6!" onClick={handleUpdate} isLoading={isSaving}>
                Actualizar
              </Button>
            </div>
            {error && <p className="text-body-sm text-accent-wishlist mt-2">{error}</p>}

            <div className="flex gap-3 mt-4">
              <Button variant="outline" onClick={handleDelete}>Eliminar</Button>
              <Button variant="slate" onClick={() => setIsAbandonOpen(true)}>Abandonar</Button>
            </div>

            <Button variant="green" className="mt-3" onClick={handleMarkFinished} isLoading={isSaving}>
              Marcar como Terminado
            </Button>
          </>
        )}
      </div>

      {book && (
        <AbandonarLibroModal
          isOpen={isAbandonOpen}
          onClose={() => setIsAbandonOpen(false)}
          bookTitle={book.title}
          initialStartDate={book.start_date ?? ''}
          onConfirm={handleAbandonConfirm}
        />
      )}
    </div>
  )
}