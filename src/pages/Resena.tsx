import { useState } from 'react'
import { ImageOff } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useBook } from '../hooks/useBook'
import { useReview } from '../hooks/useReview'
import { RatingRow } from '../assets/components/molecules/RatingRow'
import { DateInput } from '../assets/components/atoms/DateInput'
import { Textarea } from '../assets/components/atoms/Textarea'
import { Toggle } from '../assets/components/atoms/Toggle'
import { Button } from '../assets/components/atoms/Button'
import { ConfirmDialog } from '../assets/components/molecules/ConfirmDialog'
import { CustomRatingPicker } from '../assets/components/molecules/CustomRatingPicker'
import { QuotesEditor } from '../assets/components/molecules/QuotesEditor'
import { FavoriteCharacterEditor } from '../assets/components/molecules/FavoriteCharacterEditor'
import { ratingIconColor } from '../lib/ratingIcons'
import type { RatingShape } from '../assets/components/atoms/RatingIcon'
import { X } from 'lucide-react'

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
    addQuote, removeQuote,
  } = useReview(bookId, user?.id)

  const [isEditing, setIsEditing] = useState(false)
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [deleteState, setDeleteState] = useState<'closed' | 'confirm' | 'success' | 'error'>('closed')
  const [draft, setDraft] = useState<{
    start_date: string; end_date: string; general_rating: number
    general_comments: string; recommends: boolean
    favorite_character_name: string; favorite_character_notes: string; favorite_character_photo_url: string
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
    })
    setIsEditing(true)
  }

  async function handleSave() {
    if (!draft) return

    await updateBook({
      start_date: draft.start_date || null,
      end_date: draft.end_date || null,
    })

    const reviewPayload = {
      general_rating: draft.general_rating || null,
      general_comments: draft.general_comments || null,
      recommends: draft.recommends,
      favorite_character_name: draft.favorite_character_name || null,
      favorite_character_notes: draft.favorite_character_notes || null,
      favorite_character_photo_url: draft.favorite_character_photo_url || null,
    }

    if (!review) {
      await createReview(reviewPayload)
    } else {
      await updateReview(reviewPayload)
    }
    setIsEditing(false)
  }

  async function handleDelete() {
    const ok = await deleteReview()
    setDeleteState(ok ? 'success' : 'error')
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6" onClick={onClose}>
      <div className="w-full max-w-sm bg-surface rounded-3xl p-6 max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {isLoading || !book ? (
          <p className="text-center text-text-secondary py-10">Cargando...</p>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display italic text-display-md text-accent-wishlist">Reseña final</h2>
              <button onClick={onClose} aria-label="Cerrar" className="text-text-secondary">✕</button>
            </div>

            <div className="relative aspect-2/3 w-32 mx-auto rounded-xl overflow-hidden bg-border mb-4">
              {book.cover_url ? (
                <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><ImageOff size={24} className="text-text-secondary" /></div>
              )}
            </div>
            <h3 className="font-display italic text-display-md text-accent-wishlist text-center">{book.title}</h3>
            <p className="text-body-md text-text-secondary text-center mt-1">{book.author}</p>

            {!review && !isEditing && (
              <div className="text-center mt-6">
                <p className="text-body-md text-text-secondary mb-4">Aún no has escrito una reseña para este libro.</p>
                <Button variant="green" onClick={startEditing}>Crear Reseña de Lectura</Button>
              </div>
            )}

            {review && !isEditing && (
              <>
                <div className="grid grid-cols-2 gap-3 mt-4 text-center">
                  <div>
                    <p className="text-body-sm text-text-secondary">Fecha de inicio</p>
                    <p className="text-body-md text-text">{book.start_date ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-body-sm text-text-secondary">Fecha de finalización</p>
                    <p className="text-body-md text-text">{book.end_date ?? '—'}</p>
                  </div>
                </div>

                <p className="text-body-sm text-text-secondary mt-4 mb-1">Calificaciones</p>
                <div className="space-y-2">
                  <RatingRow label="General" shape="star" color="var(--color-accent-reading)" value={review.general_rating ?? 0} />
                  {customRatings.map((cr) => (
                    <RatingRow key={cr.id} label={cr.label} shape={cr.icon as RatingShape} color={ratingIconColor[cr.icon as RatingShape]} value={cr.value ?? 0} />
                  ))}
                </div>

                {review.favorite_character_name && (
                  <div className="bg-bg rounded-2xl p-4 mt-4 text-center">
                    <p className="text-body-sm text-text-secondary mb-2">Personaje favorito</p>
                    <p className="font-display italic text-body-lg text-text">{review.favorite_character_name}</p>
                    {review.favorite_character_notes && (
                      <p className="text-body-md text-text-secondary mt-2">{review.favorite_character_notes}</p>
                    )}
                  </div>
                )}

                {quotes.length > 0 && (
                  <div className="mt-4">
                    <p className="text-body-sm text-text-secondary mb-2">Citas Favoritas</p>
                    <div className="space-y-2">
                      {quotes.map((q) => (
                        <div key={q.id} className="bg-bg rounded-xl p-3">
                          <p className="font-display italic text-body-md text-text">"{q.quote_text}"</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {review.general_comments && (
                  <div className="mt-4">
                    <p className="text-body-sm text-text-secondary mb-2">Comentarios generales</p>
                    <p className="text-body-md text-text bg-bg rounded-xl p-3">{review.general_comments}</p>
                  </div>
                )}

                <div className={`mt-4 rounded-xl py-3 text-center text-body-md font-medium ${review.recommends ? 'bg-accent-finished text-surface' : 'bg-border text-text-secondary'}`}>
                  {review.recommends ? '¡Recomiendas este libro!' : 'No lo recomiendas'}
                </div>

                <div className="flex gap-3 mt-5">
                  <Button variant="outline" onClick={() => setDeleteState('confirm')}>Eliminar Reseña</Button>
                  <Button variant="amber" onClick={startEditing}>Editar Reseña</Button>
                </div>
              </>
            )}

            {isEditing && draft && (
              <>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div>
                    <label className="text-body-sm text-text-secondary block mb-1">Fecha de inicio</label>
                    <DateInput value={draft.start_date} onChange={(e) => setDraft({ ...draft, start_date: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-body-sm text-text-secondary block mb-1">Fecha de finalización</label>
                    <DateInput value={draft.end_date} onChange={(e) => setDraft({ ...draft, end_date: e.target.value })} />
                  </div>
                </div>

                <label className="text-body-sm text-text-secondary block mb-1 mt-4">Calificaciones</label>
                <div className="space-y-2">
                  <RatingRow
                    label="General" shape="star" color="var(--color-accent-reading)"
                    value={draft.general_rating} onRate={(v) => setDraft({ ...draft, general_rating: v })}
                  />
                  {customRatings.map((cr) => (
                    <div key={cr.id} className="flex items-center gap-2">
                      <div className="flex-1">
                        <RatingRow
                          label={cr.label} shape={cr.icon as RatingShape}
                          color={ratingIconColor[cr.icon as RatingShape]} value={cr.value ?? 0}
                          onRate={(v) => updateCustomRating(cr.id, v)}
                        />
                      </div>
                      <button onClick={() => removeCustomRating(cr.id)} aria-label="Eliminar calificación" className="text-text-secondary shrink-0">
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                {review && (
                  <Button variant="primary" className="mt-3" onClick={() => setIsPickerOpen(true)}>
                    Agregar Calificación Personalizada
                  </Button>
                )}

                <label className="text-body-sm text-text-secondary block mb-1 mt-5">Personaje favorito</label>
                <FavoriteCharacterEditor
                  userId={user?.id}
                  name={draft.favorite_character_name} notes={draft.favorite_character_notes} photoUrl={draft.favorite_character_photo_url}
                  onNameChange={(v) => setDraft({ ...draft, favorite_character_name: v })}
                  onNotesChange={(v) => setDraft({ ...draft, favorite_character_notes: v })}
                  onPhotoUrlChange={(v) => setDraft({ ...draft, favorite_character_photo_url: v })}
                />

                {review && (
                  <>
                    <label className="text-body-sm text-text-secondary block mb-1 mt-5">Citas Favoritas</label>
                    <QuotesEditor quotes={quotes} onAdd={addQuote} onRemove={removeQuote} />
                  </>
                )}

                <label className="text-body-sm text-text-secondary block mb-1 mt-5">Comentarios generales</label>
                <Textarea
                  placeholder="Tus pensamientos sobre el libro..." value={draft.general_comments}
                  onChange={(e) => setDraft({ ...draft, general_comments: e.target.value })} rows={4}
                />

                <div className="flex items-center justify-between mt-4">
                  <span className="text-body-md text-text">¿Recomiendas este libro?</span>
                  <Toggle checked={draft.recommends} onChange={(v) => setDraft({ ...draft, recommends: v })} />
                </div>

                {!review && (
                  <p className="text-body-sm text-text-secondary mt-3">
                    Guarda la reseña primero para poder agregar calificaciones personalizadas y citas favoritas.
                  </p>
                )}

                <div className="flex gap-3 mt-5">
                  <Button variant="outline" onClick={() => (review ? setIsEditing(false) : onClose())}>Cancelar</Button>
                  <Button variant="green" onClick={handleSave}>Guardar Cambios</Button>
                </div>
              </>
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        isOpen={deleteState !== 'closed'}
        status={deleteState === 'closed' ? 'confirm' : deleteState}
        itemLabel="reseña"
        onConfirm={handleDelete}
        onClose={() => {
          const wasSuccess = deleteState === 'success'
          setDeleteState('closed')
          if (wasSuccess) onClose()
        }}
      />

      <CustomRatingPicker
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onAdd={(rating) => addCustomRating({ ...rating, value: 0 })}
      />
    </div>
  )
}