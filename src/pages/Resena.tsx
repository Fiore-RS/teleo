import { useState, type ReactNode } from 'react'
import { ImageOff, ThumbsUp, Plus, PenLine, Trash2, Quote, AlertTriangle, X } from 'lucide-react'
import { Sheet } from '../assets/components/atoms/Sheet'
import { DetailSkeleton } from '../assets/components/atoms/Skeleton'
import { CoverImage } from '../assets/components/atoms/CoverImage'
import { useAuth } from '../hooks/useAuth'
import { useBook } from '../hooks/useBook'
import { useReview } from '../hooks/useReview'
import { useBookHistory } from '../hooks/useBookHistory'
import { RatingRow } from '../assets/components/molecules/RatingRow'
import { Button } from '../assets/components/atoms/Button'
import { ConfirmDialog } from '../assets/components/molecules/ConfirmDialog'
import { CustomRatingPicker } from '../assets/components/molecules/CustomRatingPicker'
import { QuotesEditor } from '../assets/components/molecules/QuotesEditor'
import { FavoriteCharacterEditor } from '../assets/components/molecules/FavoriteCharacterEditor'
import { ContentWarningsPicker } from '../assets/components/molecules/ContentWarningsPicker'
import { sortedWarnings } from '../lib/contentWarnings'
import { ratingIconColor } from '../lib/ratingIcons'
import { syncLatestReading } from '../lib/readingHistory'
import { supabase } from '../lib/supabase'
import type { RatingShape } from '../assets/components/atoms/RatingIcon'
import { isReviewWritten } from '../lib/reviews'
import { formatShortDate } from '../lib/date'
import { readingDatesAreValid, readingDaysLabel } from '../lib/readingDates'
import { Avatar } from '../assets/components/atoms/Avatar'
import { ReadingDatesFields } from '../assets/components/molecules/ReadingDatesFields'
import {
  FormActions, FormCard, FormCollapsible, FormSection, FormSwitchRow,
} from '../assets/components/molecules/FormLayout'

/** Fecha corta o una raya si falta ('3 sep 2026' / '—'). */
function dateOrDash(value: string | null | undefined): string {
  return formatShortDate(value) || '—'
}

/** Tus pensamientos (V.2.2.0): el espacio libre de la reseña, con una comilla de adorno. */
function ThoughtsCard({ children }: { children: ReactNode }) {
  return (
    <div className="relative bg-surface-2 border border-border rounded-[18px] px-4 pt-5 pb-4">
      <span aria-hidden="true" className="absolute left-3 -top-2.5 font-display font-semibold text-[44px] leading-none text-ornament select-none">
        “
      </span>
      {children}
    </div>
  )
}

/** Avisos de contenido al leer la reseña (V.2.1.1): una tarjeta arriba que solo dice que los
 *  hay; los avisos se muestran al tocar Ver, para quien prefiere no leerlos de golpe. */
function ContentWarningsCard({ warnings, note }: { warnings: string[]; note: string | null }) {
  const [isOpen, setIsOpen] = useState(false)
  const items = sortedWarnings(warnings)
  return (
    <section className="bg-orange-tint border border-border rounded-2xl px-4 py-3">
      <div className="flex items-center gap-2">
        <AlertTriangle size={16} className="text-orange-text shrink-0" aria-hidden="true" />
        <h4 className="text-body-md font-bold text-orange-text">Este libro tiene avisos de contenido</h4>
        <button
          type="button"
          onClick={() => setIsOpen((o) => !o)}
          aria-expanded={isOpen}
          className="ml-auto shrink-0 text-body-sm font-bold text-orange-text rounded-md focus-visible:outline-2 focus-visible:outline-primary-text"
        >
          {isOpen ? 'Ocultar' : 'Ver'}
        </button>
      </div>
      {/* Se despliega con una transición de alto (grid 0fr → 1fr). */}
      <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <div className="pt-2.5">
            {items.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {items.map((w) => (
                  <span key={w.key} className="px-3 py-1 rounded-full bg-orange-soft text-orange-text text-body-sm font-semibold">
                    {w.label}
                  </span>
                ))}
              </div>
            )}
            {note && <p className={`text-body-sm text-text-secondary ${items.length > 0 ? 'mt-2' : ''}`}>{items.length > 0 ? `También: ${note}` : note}</p>}
          </div>
        </div>
      </div>
    </section>
  )
}

interface ResenaProps {
  bookId: string
  onClose: () => void
}

export function Resena({ bookId, onClose }: ResenaProps) {
  const { user } = useAuth()
  const { book, updateBook } = useBook(bookId)
  const {
    review, customRatings, quotes, isLoading,
    createReview, updateReview, deleteReview,
    addCustomRating, updateCustomRating, removeCustomRating,
    addQuote, removeQuote, refetch: refetchReview,
  } = useReview(bookId, user?.id)
  const { history: readingHistory, refetch: refetchHistory } = useBookHistory(bookId)
  // La primera entrada (más reciente) es el ciclo actual, ya mostrado arriba con
  // book.start_date/end_date — acá solo se listan las lecturas ANTERIORES a esa.
  const pastReads = readingHistory.slice(1)

  const [isEditing, setIsEditing] = useState(false)
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [isWarningsPickerOpen, setIsWarningsPickerOpen] = useState(false)
  // Reseña nueva: las calificaciones personalizadas y las citas se guardan aquí hasta que se
  // crea la reseña, y se suben junto con ella al tocar "Guardar cambios".
  const [pendingRatings, setPendingRatings] = useState<{ id: string; label: string; icon: string; value: number }[]>([])
  const [pendingQuotes, setPendingQuotes] = useState<{ id: string; quote_text: string; page: number | null }[]>([])
  // Borrador: la reseña existe solo porque se anotaron citas mientras se leía (Mis citas).
  // Se muestra como "sin reseña", pero al escribirla las citas ya están incluidas.
  const isWritten = isReviewWritten(review)
  const shownRatings = review ? customRatings : pendingRatings
  const shownQuotes = review ? quotes : pendingQuotes

  function handleAddRating(rating: { label: string; icon: string }) {
    if (review) addCustomRating({ ...rating, value: 0 })
    else setPendingRatings((prev) => [...prev, { ...rating, value: 0, id: crypto.randomUUID() }])
  }
  function handleRateCustom(id: string, value: number) {
    if (review) updateCustomRating(id, value)
    else setPendingRatings((prev) => prev.map((r) => (r.id === id ? { ...r, value } : r)))
  }
  function handleRemoveRating(id: string) {
    if (review) removeCustomRating(id)
    else setPendingRatings((prev) => prev.filter((r) => r.id !== id))
  }
  function handleAddQuote(text: string, page: number | null) {
    if (review) addQuote(text, page)
    else setPendingQuotes((prev) => [...prev, { id: crypto.randomUUID(), quote_text: text, page }])
  }
  function handleRemoveQuote(id: string) {
    if (review) removeQuote(id)
    else setPendingQuotes((prev) => prev.filter((q) => q.id !== id))
  }
  const [deleteState, setDeleteState] = useState<'closed' | 'confirm' | 'success' | 'error'>('closed')
  const [isSaving, setIsSaving] = useState(false)
  const [draft, setDraft] = useState<{
    start_date: string; end_date: string; general_rating: number
    general_comments: string; recommends: boolean
    favorite_character_name: string; favorite_character_notes: string; favorite_character_photo_url: string
    content_warnings: string[]; content_warnings_note: string
  } | null>(null)

  function startEditing() {
    setDraft({
      start_date: book?.start_date ?? '',
      end_date: book?.end_date ?? '',
      general_rating: review?.general_rating ?? 0,
      general_comments: review?.general_comments ?? '',
      recommends: review?.recommends ?? false,
      favorite_character_name: review?.favorite_character_name ?? '',
      favorite_character_notes: review?.favorite_character_notes ?? '',
      favorite_character_photo_url: review?.favorite_character_photo_url ?? '',
      content_warnings: review?.content_warnings ?? [],
      content_warnings_note: review?.content_warnings_note ?? '',
    })
    setIsEditing(true)
  }

  const canSave = !!draft && readingDatesAreValid({ startDate: draft.start_date, endDate: draft.end_date })

  async function handleSave() {
    if (!draft || !canSave) return
    setIsSaving(true)

    const startDate = draft.start_date || null
    const endDate = draft.end_date || null
    await updateBook({ start_date: startDate, end_date: endDate })
    // Si el libro está terminado, la lectura más reciente del historial (de donde sale el reto
    // anual) se ajusta a estas fechas. Antes solo cambiaba el libro y el reto seguía contando
    // la fecha vieja.
    if (book?.status === 'terminado') {
      await syncLatestReading({ bookId, userId: user?.id, startDate, endDate })
      await refetchHistory()
    }

    const reviewPayload = {
      general_rating: draft.general_rating || null,
      general_comments: draft.general_comments.trim() || null,
      recommends: draft.recommends,
      favorite_character_name: draft.favorite_character_name || null,
      favorite_character_notes: draft.favorite_character_notes || null,
      favorite_character_photo_url: draft.favorite_character_photo_url || null,
      content_warnings: draft.content_warnings,
      content_warnings_note: draft.content_warnings_note.trim() || null,
    }

    if (!review) {
      const created = await createReview(reviewPayload)
      if (created && (pendingRatings.length > 0 || pendingQuotes.length > 0)) {
        await Promise.all([
          pendingRatings.length > 0 &&
            supabase.from('custom_ratings').insert(
              pendingRatings.map(({ label, icon, value }) => ({ review_id: created.id, label, icon, value }))
            ),
          pendingQuotes.length > 0 &&
            supabase.from('favorite_quotes').insert(
              pendingQuotes.map((q, i) => ({ review_id: created.id, quote_text: q.quote_text, sort_order: i, page: q.page }))
            ),
        ])
        setPendingRatings([])
        setPendingQuotes([])
        await refetchReview()
      }
    } else {
      await updateReview(reviewPayload)
    }
    setIsSaving(false)
    setIsEditing(false)
  }

  async function handleDelete() {
    const ok = await deleteReview()
    setDeleteState(ok ? 'success' : 'error')
  }

  const box = 'bg-surface-2 border border-border rounded-[18px]'
  const showView = !!review && isWritten && !isEditing
  const hasWarnings = (draft?.content_warnings.length ?? 0) > 0 || !!draft?.content_warnings_note.trim()
  const warningsSummary = draft
    ? draft.content_warnings.length > 0
      ? `${draft.content_warnings.length} ${draft.content_warnings.length === 1 ? 'aviso' : 'avisos'}`
      : draft.content_warnings_note.trim() ? 'Una nota' : 'Ninguno'
    : ''
  const days = readingDaysLabel(book?.start_date, book?.end_date)

  let footer: ReactNode = undefined
  if (isEditing && draft) {
    footer = (
      <FormActions>
        <Button variant="outline" onClick={() => (isWritten ? setIsEditing(false) : onClose())}>Cancelar</Button>
        <Button variant="primary" onClick={handleSave} disabled={!canSave} isLoading={isSaving}>Guardar cambios</Button>
      </FormActions>
    )
  } else if (showView) {
    footer = (
      <FormActions>
        <Button variant="outline" fullWidth={false} className="w-12.5 shrink-0 px-0!" aria-label="Eliminar reseña" onClick={() => setDeleteState('confirm')}>
          <Trash2 size={18} />
        </Button>
        <Button variant="soft" onClick={startEditing}>
          <PenLine size={17} />
          Editar reseña
        </Button>
      </FormActions>
    )
  }

  return (
    <>
      <Sheet
        onClose={onClose}
        title={isEditing ? (isWritten ? 'Editar reseña' : 'Nueva reseña') : 'Reseña de lectura'}
        footer={footer}
      >
        {isLoading || !book ? <DetailSkeleton /> : (
          <div key={isEditing ? 'edit' : 'view'} className="animate-fade-in">
            <div className={`flex gap-3.5 items-end ${isEditing ? 'mb-5.5' : 'mb-5'}`}>
              <div
                className={`relative aspect-2/3 shrink-0 overflow-hidden bg-surface-2 shadow-[0_10px_24px_-12px_rgba(60,30,10,0.55)] ${
                  isEditing ? 'w-14 rounded-[9px]' : 'w-21 rounded-xl'
                }`}
              >
                {book.cover_url ? (
                  <CoverImage src={book.cover_url ?? undefined} alt={book.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><ImageOff size={isEditing ? 16 : 22} className="text-text-secondary" /></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display font-semibold text-[20px] leading-tight text-text text-balance">{book.title}</h3>
                {book.author && <p className="text-body-md text-text-secondary mt-1">{book.author}</p>}
                {showView && (
                  <>
                    <div className="mt-2.5">
                      <RatingRow shape="star" color="var(--color-orange)" value={review.general_rating ?? 0} size={20} />
                    </div>
                    {review.recommends && (
                      <span className="inline-flex items-center gap-1.5 mt-2.5 px-3 py-1 rounded-full bg-magenta-soft text-magenta-text text-body-sm font-bold">
                        <ThumbsUp size={13} strokeWidth={2.2} />
                        Lo recomiendas
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>

            {!isWritten && !isEditing && (
              <div className="text-center mt-8">
                <p className="text-body-md text-text-secondary mb-4">
                  {quotes.length > 0
                    ? `Aún no has escrito una reseña. ${quotes.length === 1 ? 'La cita que anotaste ya está incluida' : `Las ${quotes.length} citas que anotaste ya están incluidas`}.`
                    : 'Aún no has escrito una reseña para este libro.'}
                </p>
                <Button variant="primary" onClick={startEditing}>
                  <PenLine size={17} />
                  Crear reseña de lectura
                </Button>
              </div>
            )}

            {showView && (
              <div className="stagger-children">
                {((review.content_warnings?.length ?? 0) > 0 || review.content_warnings_note) && (
                  <div className="mb-5.5">
                    <ContentWarningsCard warnings={review.content_warnings ?? []} note={review.content_warnings_note} />
                  </div>
                )}

                {review.general_comments && (
                  <FormSection label="Tus pensamientos">
                    <ThoughtsCard>
                      <p className="text-body-lg leading-relaxed text-text whitespace-pre-line">{review.general_comments}</p>
                    </ThoughtsCard>
                  </FormSection>
                )}

                {customRatings.length > 0 && (
                  <FormSection label="Calificaciones">
                    <FormCard>
                      {customRatings.map((cr) => (
                        <div key={cr.id} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                          <span className="font-body font-semibold text-body-lg text-text truncate">{cr.label}</span>
                          <RatingRow shape={cr.icon as RatingShape} color={ratingIconColor[cr.icon as RatingShape]} value={cr.value ?? 0} size={18} />
                        </div>
                      ))}
                    </FormCard>
                  </FormSection>
                )}

                {review.favorite_character_name && (
                  <FormSection label="Personaje favorito">
                    <div className={`${box} flex gap-3.5 items-center px-3.5 py-3.5`}>
                      {review.favorite_character_photo_url && (
                        <Avatar variant="character" size="md" src={review.favorite_character_photo_url} alt={review.favorite_character_name} className="ring-[1.5px] ring-border" />
                      )}
                      <div className="min-w-0">
                        <p className="font-display font-semibold italic text-body-lg text-text">{review.favorite_character_name}</p>
                        {review.favorite_character_notes && (
                          <p className="text-body-md text-text-secondary mt-0.5">{review.favorite_character_notes}</p>
                        )}
                      </div>
                    </div>
                  </FormSection>
                )}

                {quotes.length > 0 && (
                  <FormSection label="Citas favoritas">
                    <FormCard>
                      {quotes.map((q) => (
                        <div key={q.id} className="flex gap-2.5 px-3.5 py-3">
                          <Quote size={16} className="text-ornament shrink-0 mt-0.5" aria-hidden="true" />
                          <div className="min-w-0">
                            <p className="font-display italic text-body-md text-text">{q.quote_text}</p>
                            {q.page != null && <p className="text-body-sm text-text-muted mt-0.5">Pág. {q.page}</p>}
                          </div>
                        </div>
                      ))}
                    </FormCard>
                  </FormSection>
                )}

                <FormSection label="Tu lectura" className="mb-2">
                  <div className={box}>
                    <div className="flex items-center gap-2.5 px-3.5 py-3">
                      <div>
                        <p className="text-body-sm font-semibold text-text-muted">Inicio</p>
                        <p className="font-display font-semibold text-body-lg text-text">{dateOrDash(book.start_date)}</p>
                      </div>
                      <span className="text-text-muted" aria-hidden="true">→</span>
                      <div>
                        <p className="text-body-sm font-semibold text-text-muted">Final</p>
                        <p className="font-display font-semibold text-body-lg text-text">{dateOrDash(book.end_date)}</p>
                      </div>
                      {days && (
                        <span className="ml-auto shrink-0 px-2.5 py-1 rounded-full bg-primary-soft text-primary-text text-body-sm font-bold">{days}</span>
                      )}
                    </div>
                    {pastReads.length > 0 && (
                      <div className="px-3.5 pb-3">
                        <p className="text-body-sm font-semibold text-text-secondary mb-1.5">Lecturas anteriores</p>
                        <div className="flex flex-wrap gap-1.5">
                          {pastReads.map((h) => (
                            <span key={h.id} className="inline-flex px-2.5 py-1 rounded-full bg-surface border border-border text-text text-body-sm font-semibold">
                              {h.start_date
                                ? `Del ${dateOrDash(h.start_date)} al ${dateOrDash(h.end_date)}`
                                : dateOrDash(h.end_date)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </FormSection>
              </div>
            )}

            {isEditing && draft && (
              <>
                <FormSection label="Calificación">
                  <FormCard>
                    {/* Misma forma que las personalizadas (nombre a la izquierda, íconos a la
                        derecha); el espacio a la derecha iguala el de la × de las demás filas. */}
                    <div className="flex items-center justify-between gap-2 pl-3.5 pr-2 py-2.5">
                      <span className="font-body font-bold text-body-lg text-text truncate">General</span>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <RatingRow
                          shape="star" color="var(--color-orange)" size={24}
                          value={draft.general_rating} onRate={(v) => setDraft({ ...draft, general_rating: v })}
                        />
                        <span className="w-7" aria-hidden="true" />
                      </div>
                    </div>
                    {shownRatings.map((cr) => (
                      <div key={cr.id} className="flex items-center justify-between gap-2 pl-3.5 pr-2 py-2 animate-fade-in">
                        <span className="font-body font-semibold text-body-lg text-text truncate">{cr.label}</span>
                        <div className="flex items-center gap-0.5 shrink-0">
                          <RatingRow
                            shape={cr.icon as RatingShape} color={ratingIconColor[cr.icon as RatingShape]}
                            value={cr.value ?? 0} size={20} onRate={(v) => handleRateCustom(cr.id, v)}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveRating(cr.id)}
                            aria-label={`Quitar ${cr.label}`}
                            className="w-7 h-7 rounded-full text-text-muted flex items-center justify-center"
                          >
                            <X size={15} strokeWidth={2.2} />
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setIsPickerOpen(true)}
                      className="w-full flex items-center gap-2 px-3.5 py-3 font-body font-bold text-body-md text-primary-text"
                    >
                      <Plus size={16} strokeWidth={2.4} />
                      Agregar calificación
                    </button>
                    <FormSwitchRow
                      icon={ThumbsUp}
                      label="Lo recomiendo"
                      checked={draft.recommends}
                      onChange={(recommends) => setDraft({ ...draft, recommends })}
                    />
                  </FormCard>
                </FormSection>

                <FormSection label="Tus pensamientos">
                  <ThoughtsCard>
                    <textarea
                      aria-label="Tus pensamientos"
                      placeholder="Escribe todo lo que quieras sobre este libro..."
                      value={draft.general_comments}
                      rows={8}
                      onChange={(e) => setDraft({ ...draft, general_comments: e.target.value })}
                      className="w-full min-h-48 bg-transparent focus:outline-none resize-y font-body text-body-lg leading-relaxed text-text placeholder:text-text-muted"
                    />
                  </ThoughtsCard>
                </FormSection>

                <FormSection label="Personaje favorito">
                  <FavoriteCharacterEditor
                    userId={user?.id}
                    name={draft.favorite_character_name} notes={draft.favorite_character_notes} photoUrl={draft.favorite_character_photo_url}
                    onNameChange={(v) => setDraft({ ...draft, favorite_character_name: v })}
                    onNotesChange={(v) => setDraft({ ...draft, favorite_character_notes: v })}
                    onPhotoUrlChange={(v) => setDraft({ ...draft, favorite_character_photo_url: v })}
                  />
                </FormSection>

                <FormSection label="Citas favoritas">
                  <QuotesEditor quotes={shownQuotes} onAdd={handleAddQuote} onRemove={handleRemoveQuote} />
                </FormSection>

                <FormSection label="Avisos de contenido">
                  <FormCollapsible title="Avisos" summary={warningsSummary} defaultOpen={hasWarnings}>
                    {hasWarnings && (
                      <div className="px-3.5 py-3">
                        {draft.content_warnings.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {sortedWarnings(draft.content_warnings).map((w) => (
                              <span key={w.key} className="inline-flex items-center gap-1 pl-3 pr-1.5 py-1 rounded-full bg-orange-soft text-orange-text text-body-sm font-semibold">
                                {w.label}
                                <button
                                  type="button"
                                  onClick={() => setDraft({ ...draft, content_warnings: draft.content_warnings.filter((k) => k !== w.key) })}
                                  aria-label={`Quitar ${w.label}`}
                                  className="w-5 h-5 rounded-full flex items-center justify-center focus-visible:outline-2 focus-visible:outline-primary-text"
                                >
                                  <X size={13} />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                        {draft.content_warnings_note.trim() && (
                          <p className={`text-body-sm text-text-secondary ${draft.content_warnings.length > 0 ? 'mt-2' : ''}`}>
                            {draft.content_warnings.length > 0 ? `También: ${draft.content_warnings_note.trim()}` : draft.content_warnings_note.trim()}
                          </p>
                        )}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsWarningsPickerOpen(true)}
                      className="w-full flex items-center gap-2 px-3.5 py-3 font-body font-bold text-body-md text-primary-text"
                    >
                      {hasWarnings ? <PenLine size={16} /> : <Plus size={16} strokeWidth={2.4} />}
                      {hasWarnings ? 'Editar avisos' : 'Agregar avisos de contenido'}
                    </button>
                  </FormCollapsible>
                </FormSection>

                <FormSection label="Tu lectura" className="mb-2">
                  <ReadingDatesFields
                    startDate={draft.start_date}
                    endDate={draft.end_date}
                    showGoalHint={book.status === 'terminado'}
                    onChange={({ startDate, endDate }) => setDraft({ ...draft, start_date: startDate, end_date: endDate })}
                  />
                </FormSection>
              </>
            )}
          </div>
        )}
      </Sheet>

      <ConfirmDialog
        isOpen={deleteState !== 'closed'}
        status={deleteState === 'closed' ? 'confirm' : deleteState}
        itemLabel="reseña"
        feminine
        onConfirm={handleDelete}
        onClose={() => {
          const wasSuccess = deleteState === 'success'
          setDeleteState('closed')
          if (wasSuccess) onClose()
        }}
      />

      {isWarningsPickerOpen && draft && (
        <ContentWarningsPicker
          selected={draft.content_warnings}
          note={draft.content_warnings_note}
          onClose={() => setIsWarningsPickerOpen(false)}
          onSave={(content_warnings, content_warnings_note) => setDraft({ ...draft, content_warnings, content_warnings_note })}
        />
      )}

      <CustomRatingPicker
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onAdd={handleAddRating}
      />
    </>
  )
}
