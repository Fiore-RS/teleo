import { useRef, useState } from 'react'
import { ImageOff, Heart, Camera, PenLine, Trash2, RotateCcw, Play, NotebookPen } from 'lucide-react'
import { CoverImage } from '../assets/components/atoms/CoverImage'
import { useAuth } from '../hooks/useAuth'
import { useBook } from '../hooks/useBook'
import { useCoverUpload } from '../hooks/useCoverUpload'
import { useReviewExists } from '../hooks/useReviewExists'
import { useBookReadCount } from '../hooks/useBookReadCount'
import { recordBookCompletion, syncLatestReading } from '../lib/readingHistory'
import { DogEar } from '../assets/components/atoms/DogEar'
import { Tag } from '../assets/components/atoms/Tag'
import { Sheet } from '../assets/components/atoms/Sheet'
import { DetailSkeleton } from '../assets/components/atoms/Skeleton'
import { TagInput } from '../assets/components/molecules/TagInput'
import { Input } from '../assets/components/atoms/Input'
import { Select } from '../assets/components/atoms/Select'
import { SegmentedTabs } from '../assets/components/atoms/SegmentedTabs'
import { FavoriteToggle } from '../assets/components/atoms/FavoriteToggle'
import { PriorityToggle } from '../assets/components/atoms/PriorityToggle'
import { Button } from '../assets/components/atoms/Button'
import { ConfirmDialog } from '../assets/components/molecules/ConfirmDialog'
import { StartReadingDateModal } from '../assets/components/molecules/StartReadingDateModal'
import { StatusMenu } from '../assets/components/molecules/StatusMenu'
import { AbandonarLibroModal } from '../assets/components/molecules/AbandonarLibroModal'
import { FinishBookSheet } from '../assets/components/molecules/FinishBookSheet'
import { ReadingDatesFields } from '../assets/components/molecules/ReadingDatesFields'
import { readingDatesAreValid, type ReadingDates } from '../lib/readingDates'
import { statusLabel, type ReadingStatus } from '../lib/status'
import { Resena } from './Resena'
import { parseDurationInput, secondsToTimeInput } from '../lib/duration'
import { DurationMaskInput } from '../assets/components/atoms/DurationMaskInput'
import { DateInput } from '../assets/components/atoms/DateInput'
import { PriceInput } from '../assets/components/atoms/PriceInput'
import { todayLocalDate } from '../lib/date'

const categoryOptions = [
  { value: 'Libro', label: 'Libro' },
  { value: 'Novela', label: 'Novela' },
  { value: 'Novela gráfica', label: 'Novela gráfica' },
  { value: 'Novela ligera', label: 'Novela ligera' },
  { value: 'Cómic', label: 'Cómic' },
  { value: 'Manga', label: 'Manga' },
  { value: 'Manhua', label: 'Manhua' },
  { value: 'Manhwa', label: 'Manhwa' },
]

const statusOptions = (Object.keys(statusLabel) as ReadingStatus[]).map((value) => ({
  value, label: statusLabel[value],
}))

const formatOptions: { value: 'fisico' | 'digital' | 'audiolibro'; label: string }[] = [
  { value: 'fisico', label: 'Físico' },
  { value: 'digital', label: 'Digital' },
  { value: 'audiolibro', label: 'Audiolibro' },
]

interface DetalleLibroProps {
  bookId: string
  onClose: () => void
  onDeleted: () => void
}

export function DetalleLibro({ bookId, onClose, onDeleted }: DetalleLibroProps) {
  const { user } = useAuth()
  const { book, tags, isLoading, updateBook, addTag, removeTag, deleteBook } = useBook(bookId)
  const { exists: hasReview, refetch: refetchReview } = useReviewExists(bookId)
  const { count: readCount, refetch: refetchReadCount } = useBookReadCount(bookId)
  const { uploadCover, isUploading } = useCoverUpload(user?.id)
  const coverInputRef = useRef<HTMLInputElement>(null)

  async function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = await uploadCover(file)
    if (url) await updateBook({ cover_url: url })
    e.target.value = ''
  }

  const [isEditing, setIsEditing] = useState(false)
  const [isResenaOpen, setIsResenaOpen] = useState(false)
  const [isAbandonOpen, setIsAbandonOpen] = useState(false)
  const [isFinishOpen, setIsFinishOpen] = useState(false)
  const [deleteState, setDeleteState] = useState<'closed' | 'confirm' | 'success' | 'error'>('closed')
  // Actualización de estado pendiente de confirmar: cuando se marca un libro como "leyendo"
  // (desde "Retomar Lectura" o desde el selector de Estado al editar), se guarda acá la
  // actualización a aplicar y se pregunta primero si hoy debe quedar como fecha de inicio.
  const [pendingLeyendoUpdate, setPendingLeyendoUpdate] = useState<Parameters<typeof updateBook>[0] | null>(null)
  const [draft, setDraft] = useState<{
  title: string; author: string
  format: 'fisico' | 'digital' | 'audiolibro'
  category: string; status: ReadingStatus
  language: string; totalPages: string; totalDuration: string
  price: string; purchaseDate: string
  // Fechas de la lectura: solo se muestran y se guardan cuando el estado es Terminado.
  startDate: string; endDate: string
} | null>(null)

  function startEditing() {
  if (!book) return
  setDraft({
    title: book.title,
    author: book.author ?? '',
    format: (book.format ?? 'fisico') as 'fisico' | 'digital' | 'audiolibro',
    category: book.category ?? 'Novela',
    status: book.status as ReadingStatus,
    language: book.language ?? '',
    totalPages: book.total_pages ? String(book.total_pages) : '',
    totalDuration: book.total_duration_seconds ? secondsToTimeInput(book.total_duration_seconds) : '',
    price: book.price != null ? String(book.price) : '',
    purchaseDate: book.purchase_date ?? '',
    startDate: book.start_date ?? '',
    endDate: book.end_date ?? '',
  })
  setIsEditing(true)
}

  // Igual que el favorito: se guarda al toque, sin esperar a "Guardar Cambios". Si recién se
  // está marcando como prioridad (no lo era antes), se le da un orden inicial al final de la
  // lista, igual que estante_sort_order/saga_sort_order.
  function handleTogglePriority() {
    if (!book) return
    const nextPriority = !book.is_priority
    updateBook({
      is_priority: nextPriority,
      ...(nextPriority ? { priority_sort_order: Date.now() } : {}),
    })
  }

  async function handleSave() {
  if (!draft) return

  const totalDurationSeconds = draft.format === 'audiolibro'
    ? parseDurationInput(draft.totalDuration)
    : null

  const updates = {
    title: draft.title, author: draft.author || null,
    format: draft.format, category: draft.category, status: draft.status,
    language: draft.language || null,
    total_pages: draft.format !== 'audiolibro' && draft.totalPages ? parseInt(draft.totalPages, 10) : null,
    total_duration_seconds: totalDurationSeconds,
    price: draft.price ? parseFloat(draft.price) : null,
    purchase_date: draft.purchaseDate || null,
  }

  // Si se está marcando el libro como "leyendo" (y no lo estaba ya), se pregunta primero
  // si hoy debe quedar como fecha de inicio antes de guardar — ver applyPendingLeyendoUpdate.
  if (draft.status === 'leyendo' && book?.status !== 'leyendo') {
    setPendingLeyendoUpdate(updates)
    return
  }

  if (draft.status === 'terminado') {
    // Terminado: las fechas se guardan desde acá, sin pasar por la reseña, y el historial
    // de lecturas (fuente del reto anual) queda igual a ellas.
    if (!readingDatesAreValid(draft)) return
    const startDate = draft.startDate || null
    const endDate = draft.endDate || null
    await updateBook({ ...updates, start_date: startDate, end_date: endDate })
    if (book?.status === 'terminado') {
      await syncLatestReading({ bookId, userId: user?.id, startDate, endDate })
    } else {
      await recordBookCompletion({ bookId, userId: user?.id, startDate, endDate })
    }
    refetchReadCount()
    setIsEditing(false)
    return
  }

  await updateBook(updates)
  setIsEditing(false)
}

  async function applyPendingLeyendoUpdate(withStartDate: boolean) {
    if (!pendingLeyendoUpdate) return

    // Si el libro ya estaba "terminado", esto es una relectura (por el botón "Leer de
    // nuevo" o eligiendo "Leyendo" desde el menú de estado/edición): la lectura anterior ya
    // quedó guardada en el historial cuando se marcó terminada, así que acá solo se reinicia
    // el progreso de esta nueva vuelta y se limpia la fecha de fin, que ya no aplica hasta
    // que se vuelva a terminar. Si venía de "abandonado" (Retomar Lectura), no se reinicia
    // nada — se sigue desde donde se dejó.
    const isReread = book?.status === 'terminado'

    await updateBook({
      ...pendingLeyendoUpdate,
      ...(isReread ? { current_page: 0, progress_percent: 0, current_duration_seconds: 0, end_date: null } : {}),
      ...(withStartDate ? { start_date: todayLocalDate() } : {}),
    })
    setPendingLeyendoUpdate(null)
    setIsEditing(false)
  }

  async function handleDelete() {
    const ok = await deleteBook()
    setDeleteState(ok ? 'success' : 'error')
  }

  // Cambio rápido de estado desde el menú en cascada de la insignia (StatusMenu), sin
  // necesidad de entrar a "Editar Libro" — cada destino conserva el mismo flujo/datos
  // adicionales que ya se le pedían al usuario en el resto de la app para ese estado.
  async function handleStatusChange(newStatus: ReadingStatus) {
    if (newStatus === 'leyendo') {
      setPendingLeyendoUpdate({ status: 'leyendo' })
    } else if (newStatus === 'terminado') {
      setIsFinishOpen(true)
    } else if (newStatus === 'abandonado') {
      setIsAbandonOpen(true)
    } else {
      updateBook({ status: newStatus })
    }
  }

  async function handleAbandonConfirm(data: { abandon_reason: string; start_date: string; end_date: string }) {
    await updateBook({ status: 'abandonado', ...data })
    setIsAbandonOpen(false)
  }

  // Terminar desde el menú de estado: fechas en FinishBookSheet, reseña opcional.
  async function handleFinishConfirm(dates: ReadingDates, writeReview: boolean) {
    const startDate = dates.startDate || null
    const endDate = dates.endDate || null
    await updateBook({ status: 'terminado', start_date: startDate, end_date: endDate })
    await recordBookCompletion({ bookId, userId: user?.id, startDate, endDate })
    refetchReadCount()
    setIsFinishOpen(false)
    if (writeReview) setIsResenaOpen(true)
  }

  const labelClass = 'font-body font-semibold text-body-sm text-text-secondary block mb-1.5'
  const infoRows: { label: string; value: string }[] = book
    ? [
        ...(book.total_pages ? [{ label: 'Páginas', value: String(book.total_pages) }] : []),
        ...(book.language ? [{ label: 'Idioma', value: book.language }] : []),
        ...(book.format ? [{ label: 'Formato', value: formatOptions.find((f) => f.value === book.format)?.label ?? book.format }] : []),
        ...(book.category ? [{ label: 'Categoría', value: book.category }] : []),
        ...(readCount > 1 ? [{ label: 'Lecturas', value: `${readCount} veces` }] : []),
      ]
    : []

  return (
    <>
      <Sheet onClose={onClose} title={isEditing ? 'Editar libro' : 'Detalles del libro'}>
        {isLoading || !book ? <DetailSkeleton /> : (
          <>
            <div className={isEditing ? '' : 'flex gap-4 items-start mb-5'}>
            <div
              className={`relative aspect-2/3 rounded-xl overflow-hidden bg-surface-2 shadow-[0_10px_24px_-12px_rgba(60,30,10,0.55)] ${
                isEditing ? 'w-32 mx-auto mb-4' : 'w-28 shrink-0'
              }`}
            >
              {book.cover_url ? (
                <CoverImage src={book.cover_url ?? undefined} alt={book.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageOff size={24} className="text-text-secondary" />
                </div>
              )}
              {!isEditing && <DogEar status={book.status as ReadingStatus} size={34} className="absolute top-0 right-0" />}
              {!isEditing && book.is_favorite && (
                <span className="absolute bottom-2 left-2 w-7 h-7 rounded-full bg-surface/95 flex items-center justify-center shadow-sm">
                  <Heart size={14} fill="var(--color-primary)" color="var(--color-primary)" />
                </span>
              )}
              {isEditing && (
                <button
                  onClick={() => coverInputRef.current?.click()}
                  disabled={isUploading}
                  aria-label="Cambiar portada"
                  className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-surface/95 text-primary-text flex items-center justify-center shadow-sm"
                >
                  <Camera size={15} />
                </button>
              )}
            </div>
            {!isEditing && (
              <div className="flex-1 min-w-0 pt-1">
                <h3 className="font-display font-semibold text-[21px] leading-tight text-text text-balance">{book.title}</h3>
                {book.author && <p className="text-body-md text-text-secondary mt-1">{book.author}</p>}
                <div className="mt-3">
                  <StatusMenu status={book.status as ReadingStatus} onChange={handleStatusChange} />
                </div>
              </div>
            )}
            </div>
            {isEditing && (
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                onChange={handleCoverChange}
                className="hidden"
              />
            )}
            {isEditing && isUploading && (
              <p className="text-body-sm text-text-secondary text-center -mt-2 mb-2">Subiendo portada...</p>
            )}

            {!isEditing ? (
              <>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag) => <Tag key={tag} label={tag} />)}
                  </div>
                )}

                {infoRows.length > 0 && (
                  <dl className="mt-5 bg-surface-2 border border-border rounded-2xl divide-y divide-border">
                    {infoRows.map((row) => (
                      <div key={row.label} className="flex items-center justify-between gap-3 px-4 py-2.5">
                        <dt className="text-body-md text-text-secondary">{row.label}</dt>
                        <dd className="text-body-md font-semibold text-text text-right">{row.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}

                {book.status === 'abandonado' && book.abandon_reason && (
                  <div className="mt-5">
                    <p className={labelClass}>Motivo de abandono</p>
                    <p className="bg-surface-2 border border-border rounded-2xl px-4 py-3 font-display italic text-body-md text-text">
                      {book.abandon_reason}
                    </p>
                  </div>
                )}

                <div className="flex flex-col gap-2.5 mt-6">
                  {book.status === 'terminado' && (
                    <Button variant={hasReview ? 'soft' : 'primary'} onClick={() => setIsResenaOpen(true)}>
                      <NotebookPen size={18} />
                      {hasReview ? 'Ver reseña de lectura' : 'Crear reseña de lectura'}
                    </Button>
                  )}
                  {book.status === 'terminado' && (
                    <Button variant="soft" onClick={() => setPendingLeyendoUpdate({ status: 'leyendo' })}>
                      <RotateCcw size={17} />
                      Leer de nuevo
                    </Button>
                  )}
                  {book.status === 'abandonado' && (
                    <Button variant="orange" onClick={() => setPendingLeyendoUpdate({ status: 'leyendo' })}>
                      <Play size={17} />
                      Retomar lectura
                    </Button>
                  )}

                  <div className="flex gap-2.5">
                    <Button variant="outline" onClick={() => setDeleteState('confirm')}>
                      <Trash2 size={17} />
                      Eliminar
                    </Button>
                    <Button variant="soft" onClick={startEditing}>
                      <PenLine size={17} />
                      Editar
                    </Button>
                  </div>
                </div>
              </>
            ) : draft ? (
              <div className="flex flex-col gap-4">
                <div>
                  <label className={labelClass}>Título</label>
                  <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
                </div>

                <div>
                  <label className={labelClass}>Autor</label>
                  <Input value={draft.author} onChange={(e) => setDraft({ ...draft, author: e.target.value })} />
                </div>

                <div>
                  <label className={labelClass}>Formato</label>
                  <SegmentedTabs options={formatOptions} active={draft.format} onChange={(format) => setDraft({ ...draft, format })} />
                </div>

                {draft.format !== 'digital' ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      {draft.format === 'audiolibro' ? (
                        <>
                          <label className={labelClass}>Duración</label>
                          <DurationMaskInput value={draft.totalDuration} onChange={(v) => setDraft({ ...draft, totalDuration: v })} />
                        </>
                      ) : (
                        <>
                          <label className={labelClass}>Páginas</label>
                          <Input type="number" placeholder="000" value={draft.totalPages} onChange={(e) => setDraft({ ...draft, totalPages: e.target.value })} />
                        </>
                      )}
                    </div>
                    <div>
                      <label className={labelClass}>Idioma</label>
                      <Input placeholder="Español" value={draft.language} onChange={(e) => setDraft({ ...draft, language: e.target.value })} />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className={labelClass}>Idioma</label>
                    <Input placeholder="Español" value={draft.language} onChange={(e) => setDraft({ ...draft, language: e.target.value })} />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Categoría</label>
                    <Select options={categoryOptions} value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelClass}>Estado</label>
                    <Select
                      options={statusOptions}
                      value={draft.status}
                      onChange={(e) => {
                        const status = e.target.value as ReadingStatus
                        // Al pasar a Terminado sin fecha de fin, se propone hoy.
                        const endDate = status === 'terminado' && book?.status !== 'terminado' && !draft.endDate ? todayLocalDate() : draft.endDate
                        setDraft({ ...draft, status, endDate })
                      }}
                    />
                  </div>
                </div>

                {draft.status === 'terminado' && (
                  <ReadingDatesFields
                    startDate={draft.startDate}
                    endDate={draft.endDate}
                    onChange={(dates) => setDraft({ ...draft, ...dates })}
                  />
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Precio</label>
                    <PriceInput value={draft.price} onChange={(price) => setDraft({ ...draft, price })} />
                  </div>
                  <div>
                    <label className={labelClass}>Fecha de compra</label>
                    <DateInput value={draft.purchaseDate} onChange={(e) => setDraft({ ...draft, purchaseDate: e.target.value })} />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Etiquetas</label>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {tags.map((tag) => <Tag key={tag} label={tag} onRemove={() => removeTag(tag)} />)}
                    </div>
                  )}
                  <TagInput onAdd={addTag} />
                </div>

                <div className={`grid gap-3 ${draft.status === 'pendiente' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  <div>
                    <label className={`${labelClass} text-center`}>Favorito</label>
                    <FavoriteToggle isFavorite={book.is_favorite ?? false} onToggle={() => updateBook({ is_favorite: !book.is_favorite })} />
                  </div>
                  {draft.status === 'pendiente' && (
                    <div>
                      <label className={`${labelClass} text-center`}>Esta temporada</label>
                      <PriorityToggle isPriority={book.is_priority ?? false} onToggle={handleTogglePriority} />
                    </div>
                  )}
                </div>

                <div className="flex gap-2.5 mt-2">
                  <Button variant="outline" onClick={() => setIsEditing(false)}>Cancelar</Button>
                  <Button variant="primary" onClick={handleSave} disabled={draft.status === 'terminado' && !readingDatesAreValid(draft)}>Guardar cambios</Button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </Sheet>

      <ConfirmDialog
        isOpen={deleteState !== 'closed'}
        status={deleteState === 'closed' ? 'confirm' : deleteState}
        itemLabel="libro"
        onConfirm={handleDelete}
        onClose={() => {
          const wasSuccess = deleteState === 'success'
          setDeleteState('closed')
          if (wasSuccess) onDeleted()
        }}
      />

      <StartReadingDateModal
        isOpen={pendingLeyendoUpdate !== null}
        onConfirm={() => applyPendingLeyendoUpdate(true)}
        onDismiss={() => applyPendingLeyendoUpdate(false)}
      />

      {book && (
        <AbandonarLibroModal
          isOpen={isAbandonOpen}
          onClose={() => setIsAbandonOpen(false)}
          bookTitle={book.title}
          initialStartDate={book.start_date ?? ''}
          onConfirm={handleAbandonConfirm}
        />
      )}

      {isFinishOpen && book && (
        <FinishBookSheet
          bookTitle={book.title}
          initialStartDate={book.start_date}
          onClose={() => setIsFinishOpen(false)}
          onConfirm={handleFinishConfirm}
        />
      )}

      {isResenaOpen && (
        <Resena
          bookId={bookId}
          onClose={() => {
            setIsResenaOpen(false)
            refetchReview()
          }}
        />
      )}
    </>
  )
}
