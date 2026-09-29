import { useState } from 'react'
import { ImageOff, ThumbsUp, Plus, PenLine, Trash2, Quote, AlertTriangle } from 'lucide-react'
import { Sheet } from '../assets/components/atoms/Sheet'
import { DetailSkeleton } from '../assets/components/atoms/Skeleton'
import { CoverImage } from '../assets/components/atoms/CoverImage'
import { useAuth } from '../hooks/useAuth'
import { useBook } from '../hooks/useBook'
import { useReview } from '../hooks/useReview'
import { useBookHistory } from '../hooks/useBookHistory'
import { RatingRow } from '../assets/components/molecules/RatingRow'
import { DateInput } from '../assets/components/atoms/DateInput'
import { Textarea } from '../assets/components/atoms/Textarea'
import { Toggle } from '../assets/components/atoms/Toggle'
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
import { X } from 'lucide-react'
import { isReviewWritten } from '../lib/reviews'

const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

/** 'YYYY-MM-DD' → '3 sep 2026' (sin pasar por Date, para evitar el desfase de zona horaria). */
function formatShortDate(value: string | null | undefined): string {
  if (!value) return '—'
  const [y, m, d] = value.split('-').map((n) => parseInt(n, 10))
  if (!y || !m || !d) return value
  return `${d} ${MONTHS_SHORT[m - 1]} ${y}`
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="flex items-center gap-2 mb-2.5 font-body font-bold text-body-sm uppercase tracking-[0.14em] text-primary-text">
      <span className="w-4 h-0.5 rounded-full bg-primary-text" aria-hidden="true" />
      {children}
    </p>
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

  async function handleSave() {
    if (!draft) return

    const startDate = draft.start_date || null
    const endDate = draft.end_date || null
    if (startDate && endDate && startDate > endDate) return
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
      general_comments: draft.general_comments || null,
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
    setIsEditing(false)
  }

  async function handleDelete() {
    const ok = await deleteReview()
    setDeleteState(ok ? 'success' : 'error')
  }

  const labelClass = 'font-body font-semibold text-body-sm text-text-secondary block mb-1.5'
  const box = 'bg-surface-2 border border-border rounded-2xl'

  return (
    <>
      <Sheet onClose={onClose} title={isEditing ? (isWritten ? 'Editar reseña' : 'Nueva reseña') : 'Reseña de lectura'}>
        {isLoading || !book ? <DetailSkeleton /> : (
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
                {review && isWritten && !isEditing && (
                  <div className="mt-2.5">
                    <RatingRow shape="star" color="var(--color-orange)" value={review.general_rating ?? 0} size={18} />
                  </div>
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

            {review && isWritten && !isEditing && (
              <div className="flex flex-col gap-6 mt-6 stagger-children">
                {((review.content_warnings?.length ?? 0) > 0 || review.content_warnings_note) && (
                  <ContentWarningsCard warnings={review.content_warnings ?? []} note={review.content_warnings_note} />
                )}

                <section>
                  <SectionLabel>Tu lectura</SectionLabel>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className={`${box} px-3.5 py-3`}>
                      <p className="font-display font-semibold text-body-lg text-text">{formatShortDate(book.start_date)}</p>
                      <p className="text-body-sm text-text-secondary mt-0.5">Inicio</p>
                    </div>
                    <div className={`${box} px-3.5 py-3`}>
                      <p className="font-display font-semibold text-body-lg text-text">{formatShortDate(book.end_date)}</p>
                      <p className="text-body-sm text-text-secondary mt-0.5">Final</p>
                    </div>
                  </div>
                  {pastReads.length > 0 && (
                    <div className="mt-3">
                      <p className="text-body-sm font-semibold text-text-secondary mb-1.5">Lecturas anteriores</p>
                      <div className="flex flex-wrap gap-1.5">
                        {pastReads.map((h) => (
                          <span key={h.id} className="inline-flex px-3 py-1.5 rounded-full bg-primary-soft text-primary-text text-body-sm font-semibold">
                            {h.start_date
                              ? `Del ${formatShortDate(h.start_date)} al ${formatShortDate(h.end_date)}`
                              : formatShortDate(h.end_date)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </section>

                <section>
                  <SectionLabel>Calificaciones</SectionLabel>
                  <div className={`${box} px-4 py-3 space-y-2`}>
                    <RatingRow label="General" shape="star" color="var(--color-orange)" value={review.general_rating ?? 0} />
                    {customRatings.map((cr) => (
                      <RatingRow key={cr.id} label={cr.label} shape={cr.icon as RatingShape} color={ratingIconColor[cr.icon as RatingShape]} value={cr.value ?? 0} />
                    ))}
                  </div>
                </section>

                {review.favorite_character_name && (
                  <section>
                    <SectionLabel>Personaje favorito</SectionLabel>
                    <div className={`${box} px-4 py-3.5`}>
                      <p className="font-display font-semibold italic text-body-lg text-text">{review.favorite_character_name}</p>
                      {review.favorite_character_notes && (
                        <p className="text-body-md text-text-secondary mt-1.5">{review.favorite_character_notes}</p>
                      )}
                    </div>
                  </section>
                )}

                {quotes.length > 0 && (
                  <section>
                    <SectionLabel>Citas favoritas</SectionLabel>
                    <div className="space-y-2">
                      {quotes.map((q) => (
                        <div key={q.id} className={`${box} px-4 py-3 flex gap-2.5`}>
                          <Quote size={16} className="text-ornament shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <p className="font-display italic text-body-md text-text">{q.quote_text}</p>
                            {q.page != null && <p className="text-body-sm text-text-secondary mt-1">Pág. {q.page}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {review.general_comments && (
                  <section>
                    <SectionLabel>Comentarios</SectionLabel>
                    <p className={`${box} px-4 py-3 text-body-md leading-relaxed text-text whitespace-pre-line`}>{review.general_comments}</p>
                  </section>
                )}

                <div
                  className={`flex items-center justify-center gap-2 rounded-full py-2.5 text-body-md font-bold ${
                    review.recommends ? 'bg-magenta-soft text-magenta-text' : 'bg-surface-2 border border-border text-text-secondary'
                  }`}
                >
                  <ThumbsUp size={16} className={review.recommends ? '' : 'rotate-180'} />
                  {review.recommends ? 'Recomiendas este libro' : 'No lo recomiendas'}
                </div>

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
            )}

            {isEditing && draft && (
              <div className="flex flex-col gap-5 mt-5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Fecha de inicio</label>
                    <DateInput value={draft.start_date} onChange={(e) => setDraft({ ...draft, start_date: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelClass}>Fecha de final</label>
                    <DateInput value={draft.end_date} onChange={(e) => setDraft({ ...draft, end_date: e.target.value })} />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Calificaciones</label>
                  <div className={`${box} px-4 py-3 space-y-2`}>
                    <RatingRow
                      label="General" shape="star" color="var(--color-orange)"
                      value={draft.general_rating} onRate={(v) => setDraft({ ...draft, general_rating: v })}
                    />
                    {shownRatings.map((cr) => (
                      <div key={cr.id} className="flex items-center gap-2">
                        <div className="flex-1">
                          <RatingRow
                            label={cr.label} shape={cr.icon as RatingShape}
                            color={ratingIconColor[cr.icon as RatingShape]} value={cr.value ?? 0}
                            onRate={(v) => handleRateCustom(cr.id, v)}
                          />
                        </div>
                        <button
                          onClick={() => handleRemoveRating(cr.id)}
                          aria-label="Eliminar calificación"
                          className="w-7 h-7 rounded-full bg-primary-soft text-primary-text flex items-center justify-center shrink-0"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <Button variant="soft" size="sm" className="mt-2.5" onClick={() => setIsPickerOpen(true)}>
                    <Plus size={16} />
                    Agregar calificación personalizada
                  </Button>
                </div>

                <div>
                  <label className={labelClass}>Personaje favorito</label>
                  <FavoriteCharacterEditor
                    userId={user?.id}
                    name={draft.favorite_character_name} notes={draft.favorite_character_notes} photoUrl={draft.favorite_character_photo_url}
                    onNameChange={(v) => setDraft({ ...draft, favorite_character_name: v })}
                    onNotesChange={(v) => setDraft({ ...draft, favorite_character_notes: v })}
                    onPhotoUrlChange={(v) => setDraft({ ...draft, favorite_character_photo_url: v })}
                  />
                </div>

                <div>
                  <label className={labelClass}>Citas favoritas</label>
                  <QuotesEditor quotes={shownQuotes} onAdd={handleAddQuote} onRemove={handleRemoveQuote} />
                </div>

                <div>
                  <label className={labelClass}>Comentarios</label>
                  <Textarea
                    placeholder="Tus pensamientos sobre el libro..." value={draft.general_comments}
                    onChange={(e) => setDraft({ ...draft, general_comments: e.target.value })} rows={4}
                  />
                </div>

                <div>
                  <label className={labelClass}>Avisos de contenido</label>
                  {(draft.content_warnings.length > 0 || draft.content_warnings_note.trim()) && (
                    <div className="mb-2.5">
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
                        <p className="text-body-sm text-text-secondary mt-2">También: {draft.content_warnings_note.trim()}</p>
                      )}
                    </div>
                  )}
                  <Button variant="soft" size="sm" onClick={() => setIsWarningsPickerOpen(true)}>
                    {draft.content_warnings.length > 0 || draft.content_warnings_note.trim() ? <PenLine size={16} /> : <Plus size={16} />}
                    {draft.content_warnings.length > 0 || draft.content_warnings_note.trim() ? 'Editar avisos' : 'Agregar avisos de contenido'}
                  </Button>
                </div>

                <div className={`${box} flex items-center justify-between gap-3 px-4 py-3`}>
                  <span className="text-body-md font-semibold text-text">¿Recomiendas este libro?</span>
                  <Toggle checked={draft.recommends} onChange={(v) => setDraft({ ...draft, recommends: v })} />
                </div>

                <div className="flex gap-2.5">
                  <Button variant="outline" onClick={() => (isWritten ? setIsEditing(false) : onClose())}>Cancelar</Button>
                  <Button variant="primary" onClick={handleSave}>Guardar cambios</Button>
                </div>
              </div>
            )}
          </>
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
