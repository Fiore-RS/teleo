import { useState } from 'react'
import { ImageOff, Heart, PenLine, Trash2, RotateCcw, Play, NotebookPen, CalendarPlus, Quote } from 'lucide-react'
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
import { Button } from '../assets/components/atoms/Button'
import { ConfirmDialog } from '../assets/components/molecules/ConfirmDialog'
import { StartReadingDateModal } from '../assets/components/molecules/StartReadingDateModal'
import { StatusMenu } from '../assets/components/molecules/StatusMenu'
import { AbandonarLibroModal } from '../assets/components/molecules/AbandonarLibroModal'
import { FinishBookSheet } from '../assets/components/molecules/FinishBookSheet'
import { EditBookForm, type BookDraft } from '../assets/components/molecules/EditBookForm'
import { FormActions, FormCard, FormSection } from '../assets/components/molecules/FormLayout'
import { readingDatesAreValid, type ReadingDates } from '../lib/readingDates'
import { type ReadingStatus } from '../lib/status'
import { formatOptions, type BookFormat } from '../lib/options'
import { languageLabel, languageOptionsFrom, normalizeLanguage } from '../lib/languages'
import { useBookLanguages } from '../hooks/useBookLanguages'
import { Resena } from './Resena'
import { AddQuoteSheet } from '../assets/components/molecules/AddQuoteSheet'
import { useQuotes } from '../hooks/useQuotes'
import { parseDurationInput, secondsToTimeInput } from '../lib/duration'
import { todayLocalDate } from '../lib/date'
import { useProfile } from '../hooks/useProfile'
import { useReleases, type Release } from '../hooks/useReleases'
import { ReleaseRow } from '../assets/components/molecules/ReleaseRow'
import { ReleaseFormSheet } from '../assets/components/molecules/ReleaseFormSheet'

interface DetalleLibroProps {
  bookId: string
  onClose: () => void
  onDeleted: () => void
}

export function DetalleLibro({ bookId, onClose, onDeleted }: DetalleLibroProps) {
  const { user } = useAuth()
  const { book, tags, isLoading, updateBook, addTag, removeTag, deleteBook } = useBook(bookId)
  const { exists: hasReview, refetch: refetchReview } = useReviewExists(bookId)
  const { addQuote } = useQuotes(user?.id)
  const [isAddingQuote, setIsAddingQuote] = useState(false)
  const { count: readCount, refetch: refetchReadCount } = useBookReadCount(bookId)
  const { uploadCover, isUploading } = useCoverUpload(user?.id)
  const { profile } = useProfile(user?.id)
  const bookLanguages = useBookLanguages(user?.id)
  // Lanzamientos enlazados a este libro (fase 7). null = formulario cerrado.
  const { releases } = useReleases(user?.id)
  const bookReleases = releases.filter((r) => r.book_id === bookId)
  const [releaseForm, setReleaseForm] = useState<{ release?: Release } | null>(null)

  // La portada se sube y se guarda al elegirla, sin esperar a "Guardar cambios".
  async function handleCoverFile(file: File) {
    const url = await uploadCover(file)
    if (url) await updateBook({ cover_url: url })
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
  const [draft, setDraft] = useState<BookDraft | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  function startEditing() {
    if (!book) return
    setDraft({
      title: book.title,
      author: book.author ?? '',
      format: (book.format ?? 'fisico') as BookFormat,
      category: book.category ?? 'Novela',
      status: book.status as ReadingStatus,
      // Los idiomas escritos a mano ("Español") se reconocen y pasan a su código.
      language: normalizeLanguage(book.language) ?? '',
      totalPages: book.total_pages ? String(book.total_pages) : '',
      totalDuration: book.total_duration_seconds ? secondsToTimeInput(book.total_duration_seconds) : '',
      price: book.price != null ? String(book.price) : '',
      purchaseDate: book.purchase_date ?? '',
      isGift: book.is_gift ?? false,
      giftFrom: book.gift_from ?? '',
      startDate: book.start_date ?? '',
      endDate: book.end_date ?? '',
      abandonReason: book.abandon_reason ?? '',
      isFavorite: book.is_favorite ?? false,
      isPriority: book.is_priority ?? false,
    })
    setIsEditing(true)
  }

  const draftHasDates = draft?.status === 'terminado' || draft?.status === 'abandonado'
  const canSave = !!draft && draft.title.trim() !== '' && (!draftHasDates || readingDatesAreValid(draft))

  async function handleSave() {
    if (!draft || !book || !canSave) return

    const totalDurationSeconds = draft.format === 'audiolibro'
      ? parseDurationInput(draft.totalDuration)
      : null

    // Esta temporada solo se muestra en Pendiente; en otro estado se deja como estaba. Si
    // recién se marca, se le da un orden inicial al final de la lista.
    const priorityUpdate = draft.status === 'pendiente' && draft.isPriority !== (book.is_priority ?? false)
      ? { is_priority: draft.isPriority, ...(draft.isPriority ? { priority_sort_order: Date.now() } : {}) }
      : {}

    const updates = {
      title: draft.title.trim(), author: draft.author.trim() || null,
      format: draft.format, category: draft.category, status: draft.status,
      language: draft.language || null,
      total_pages: draft.format !== 'audiolibro' && draft.totalPages ? parseInt(draft.totalPages, 10) : null,
      total_duration_seconds: totalDurationSeconds,
      // Un regalo cuenta como ₡0: no suma al total invertido de Compras.
      price: draft.isGift ? 0 : draft.price ? parseFloat(draft.price) : null,
      purchase_date: draft.purchaseDate || null,
      is_gift: draft.isGift,
      gift_from: draft.isGift ? draft.giftFrom.trim().slice(0, 60) || null : null,
      is_favorite: draft.isFavorite,
      ...priorityUpdate,
    }

    // Si se está marcando el libro como "leyendo" (y no lo estaba ya), se pregunta primero
    // si hoy debe quedar como fecha de inicio antes de guardar — ver applyPendingLeyendoUpdate.
    if (draft.status === 'leyendo' && book.status !== 'leyendo') {
      setPendingLeyendoUpdate(updates)
      return
    }

    setIsSaving(true)
    const startDate = draft.startDate || null
    const endDate = draft.endDate || null

    if (draft.status === 'terminado') {
      // Terminado: las fechas se guardan desde acá, sin pasar por la reseña, y el historial
      // de lecturas (fuente del reto anual) queda igual a ellas.
      await updateBook({ ...updates, start_date: startDate, end_date: endDate })
      if (book.status === 'terminado') {
        await syncLatestReading({ bookId, userId: user?.id, startDate, endDate })
      } else {
        await recordBookCompletion({ bookId, userId: user?.id, startDate, endDate })
      }
      refetchReadCount()
    } else if (draft.status === 'abandonado') {
      await updateBook({
        ...updates,
        start_date: startDate,
        end_date: endDate,
        abandon_reason: draft.abandonReason.trim() || null,
      })
    } else {
      await updateBook(updates)
    }

    setIsSaving(false)
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

  const infoRows: { label: string; value: string }[] = book
    ? [
        ...(book.total_pages ? [{ label: 'Páginas', value: String(book.total_pages) }] : []),
        ...(book.language ? [{ label: 'Idioma', value: languageLabel(book.language) }] : []),
        ...(book.format ? [{ label: 'Formato', value: formatOptions.find((f) => f.value === book.format)?.label ?? book.format }] : []),
        ...(book.category ? [{ label: 'Categoría', value: book.category }] : []),
        ...(readCount > 1 ? [{ label: 'Lecturas', value: `${readCount} veces` }] : []),
        ...(book.is_gift ? [{ label: 'Regalo', value: book.gift_from ? `De ${book.gift_from}` : 'Sí' }] : []),
      ]
    : []

  return (
    <>
      <Sheet
        onClose={onClose}
        title={isEditing ? 'Editar libro' : 'Detalles del libro'}
        footer={!isEditing && book ? (
          <FormActions>
            <Button variant="outline" fullWidth={false} className="w-12.5 shrink-0 px-0!" aria-label="Eliminar libro" onClick={() => setDeleteState('confirm')}>
              <Trash2 size={18} />
            </Button>
            <Button variant="soft" onClick={startEditing}>
              <PenLine size={17} />
              Editar libro
            </Button>
          </FormActions>
        ) : isEditing && draft ? (
          <FormActions>
            <Button variant="outline" onClick={() => setIsEditing(false)}>Cancelar</Button>
            <Button variant="primary" onClick={handleSave} disabled={!canSave} isLoading={isSaving}>Guardar cambios</Button>
          </FormActions>
        ) : undefined}
      >
        {isLoading || !book ? <DetailSkeleton /> : isEditing && draft ? (
          <div key="edit" className="animate-fade-in">
            <EditBookForm
              coverUrl={book.cover_url}
              savedStatus={book.status as ReadingStatus}
              draft={draft}
              onChange={(patch) => setDraft({ ...draft, ...patch })}
              tags={tags}
              onAddTag={addTag}
              onRemoveTag={removeTag}
              languageOptions={languageOptionsFrom(bookLanguages)}
              currency={profile?.currency}
              onCoverFile={handleCoverFile}
              isUploadingCover={isUploading}
            />
          </div>
        ) : (
          <div key="detail" className="animate-fade-in">
            <div className="flex gap-4 items-start mb-4">
              <div className="relative aspect-2/3 rounded-xl overflow-hidden bg-surface-2 shadow-[0_10px_24px_-12px_rgba(60,30,10,0.55)] w-26 shrink-0">
                {book.cover_url ? (
                  <CoverImage src={book.cover_url ?? undefined} alt={book.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageOff size={24} className="text-text-secondary" />
                  </div>
                )}
                <DogEar status={book.status as ReadingStatus} size={34} className="absolute top-0 right-0" />
                {book.is_favorite && (
                  <span className="absolute bottom-2 left-2 w-7 h-7 rounded-full bg-surface/95 flex items-center justify-center shadow-sm">
                    <Heart size={14} fill="var(--color-primary)" color="var(--color-primary)" />
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <h3 className="font-display font-semibold text-[21px] leading-tight text-text text-balance">{book.title}</h3>
                {book.author && <p className="text-body-md text-text-secondary mt-1">{book.author}</p>}
                <div className="mt-3">
                  <StatusMenu status={book.status as ReadingStatus} onChange={handleStatusChange} align="left" />
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {tags.map((tag) => <Tag key={tag} label={tag} />)}
                  </div>
                )}
              </div>
            </div>

            {/* Acciones del estado actual, justo debajo de la ficha (V.2.2.0). */}
            {(book.status === 'terminado' || book.status === 'leyendo' || book.status === 'abandonado' ||
              (book.status === 'deseado' && bookReleases.length === 0)) && (
              <div className="flex gap-2 mb-5.5">
                {book.status === 'terminado' && (
                  <>
                    <Button variant={hasReview ? 'soft' : 'primary'} className="flex-[1.5] px-3!" onClick={() => setIsResenaOpen(true)}>
                      <NotebookPen size={16} />
                      {hasReview ? 'Ver reseña' : 'Crear reseña'}
                    </Button>
                    <Button variant="outline" className="flex-1 px-3!" onClick={() => setPendingLeyendoUpdate({ status: 'leyendo' })}>
                      <RotateCcw size={15} />
                      Leer de nuevo
                    </Button>
                  </>
                )}
                {book.status === 'leyendo' && (
                  <Button variant="soft" onClick={() => setIsAddingQuote(true)}>
                    <Quote size={16} />
                    Anotar una cita
                  </Button>
                )}
                {book.status === 'abandonado' && (
                  <Button variant="orange" onClick={() => setPendingLeyendoUpdate({ status: 'leyendo' })}>
                    <Play size={16} />
                    Retomar lectura
                  </Button>
                )}
                {book.status === 'deseado' && (
                  <Button variant="soft" onClick={() => setReleaseForm({})}>
                    <CalendarPlus size={16} />
                    Agregar lanzamiento
                  </Button>
                )}
              </div>
            )}

            {book.status === 'abandonado' && book.abandon_reason && (
              <FormSection label="Motivo de abandono">
                <div className="relative bg-surface-2 border border-border rounded-[18px] px-4 pt-4.5 pb-3.5">
                  <span aria-hidden="true" className="absolute left-3 -top-2.5 font-display font-semibold text-[40px] leading-none text-ornament select-none">
                    “
                  </span>
                  <p className="font-display italic text-body-lg leading-relaxed text-text">{book.abandon_reason}</p>
                </div>
              </FormSection>
            )}

            {bookReleases.length > 0 && (
              <FormSection label={bookReleases.length === 1 ? 'Lanzamiento' : 'Lanzamientos'}>
                <div className="flex flex-col gap-2">
                  {bookReleases.map((r) => (
                    <ReleaseRow key={r.id} release={r} currency={profile?.currency} onClick={() => setReleaseForm({ release: r })} />
                  ))}
                </div>
              </FormSection>
            )}

            {infoRows.length > 0 && (
              <FormSection label="El libro" className="mb-2">
                <FormCard>
                  <dl className="divide-y divide-border">
                    {infoRows.map((row) => (
                      <div key={row.label} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                        <dt className="text-body-md text-text-secondary">{row.label}</dt>
                        <dd className="text-body-md font-bold text-text text-right">{row.value}</dd>
                      </div>
                    ))}
                  </dl>
                </FormCard>
              </FormSection>
            )}
          </div>
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

      {releaseForm && (
        <ReleaseFormSheet
          userId={user?.id}
          release={releaseForm.release}
          initialBookId={bookId}
          onClose={() => setReleaseForm(null)}
        />
      )}

      {isAddingQuote && book && (
        <AddQuoteSheet
          userId={user?.id}
          initialBook={{ id: book.id, title: book.title, author: book.author, cover_url: book.cover_url, status: book.status }}
          initialPage={book.current_page}
          onClose={() => setIsAddingQuote(false)}
          onSave={addQuote}
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
