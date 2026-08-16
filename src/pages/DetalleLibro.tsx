import { useState } from 'react'
import { ImageOff, Heart, Pencil } from 'lucide-react'
import { useBook } from '../hooks/useBook'
import { useReviewExists } from '../hooks/useReviewExists'
import { DogEar } from '../assets/components/atoms/DogEar'
import { Badge } from '../assets/components/atoms/Badge'
import { Tag } from '../assets/components/atoms/Tag'
import { HorizontalScroller } from '../assets/components/atoms/HorizontalScroller'
import { TagInput } from '../assets/components/molecules/TagInput'
import { Input } from '../assets/components/atoms/Input'
import { Select } from '../assets/components/atoms/Select'
import { SegmentedTabs } from '../assets/components/atoms/SegmentedTabs'
import { FavoriteToggle } from '../assets/components/atoms/FavoriteToggle'
import { Button } from '../assets/components/atoms/Button'
import { ConfirmDialog } from '../assets/components/molecules/ConfirmDialog'
import { statusLabel, type ReadingStatus } from '../lib/status'
import { Resena } from './Resena'
import { parseDurationInput, secondsToTimeInput } from '../lib/duration'
import { DurationMaskInput } from '../assets/components/atoms/DurationMaskInput'

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
  { value: 'audiolibro', label: 'Audio Libro' },
]

interface DetalleLibroProps {
  bookId: string
  onClose: () => void
  onDeleted: () => void
}

export function DetalleLibro({ bookId, onClose, onDeleted }: DetalleLibroProps) {
  const { book, tags, isLoading, updateBook, addTag, removeTag, deleteBook } = useBook(bookId)
  const { exists: hasReview, refetch: refetchReview } = useReviewExists(bookId)

  const [isEditing, setIsEditing] = useState(false)
  const [isResenaOpen, setIsResenaOpen] = useState(false)
  const [deleteState, setDeleteState] = useState<'closed' | 'confirm' | 'success' | 'error'>('closed')
  const [draft, setDraft] = useState<{
  title: string; author: string
  format: 'fisico' | 'digital' | 'audiolibro'
  category: string; status: ReadingStatus
  language: string; totalPages: string; totalDuration: string
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
  })
  setIsEditing(true)
}

  async function handleSave() {
  if (!draft) return

  const totalDurationSeconds = draft.format === 'audiolibro'
    ? parseDurationInput(draft.totalDuration)
    : null

  await updateBook({
    title: draft.title, author: draft.author || null,
    format: draft.format, category: draft.category, status: draft.status,
    language: draft.language || null,
    total_pages: draft.format !== 'audiolibro' && draft.totalPages ? parseInt(draft.totalPages, 10) : null,
    total_duration_seconds: totalDurationSeconds,
  })
  setIsEditing(false)
}

  async function handleDelete() {
    const ok = await deleteBook()
    setDeleteState(ok ? 'success' : 'error')
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6" onClick={onClose}>
      <div
        className="w-full max-w-sm bg-surface rounded-3xl p-6 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {isLoading || !book ? (
          <p className="text-center text-text-secondary py-10">Cargando...</p>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display italic text-display-md text-accent-wishlist">
                {isEditing ? 'Editar detalles del Libro' : 'Detalles del Libro'}
              </h2>
              <button onClick={onClose} aria-label="Cerrar" className="text-text-secondary">✕</button>
            </div>

            <div className="relative aspect-2/3 w-36 mx-auto rounded-xl overflow-hidden bg-border mb-4">
              {book.cover_url ? (
                <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageOff size={24} className="text-text-secondary" />
                </div>
              )}
              {!isEditing && <DogEar status={book.status as ReadingStatus} size={36} className="absolute top-0 right-0" />}
              {!isEditing && book.is_favorite && (
                <span className="absolute bottom-2 left-2 w-7 h-7 rounded-full bg-surface flex items-center justify-center shadow-sm">
                  <Heart size={14} fill="var(--color-accent-wishlist)" color="var(--color-accent-wishlist)" />
                </span>
              )}
              {isEditing && (
                <span className="absolute bottom-2 left-2 w-7 h-7 rounded-full bg-surface flex items-center justify-center shadow-sm">
                  <Pencil size={14} className="text-accent-reading" />
                </span>
              )}
            </div>

            {!isEditing ? (
              <>
                <h3 className="font-display italic text-display-md text-accent-wishlist text-center">{book.title}</h3>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-body-md text-text-secondary">{book.author}</p>
                  <Badge status={book.status as ReadingStatus} />
                </div>

                {tags.length > 0 && (
                  <HorizontalScroller className="mt-3">
                    {tags.map((tag) => <Tag key={tag} label={tag} />)}
                  </HorizontalScroller>
                )}

                <div className="grid grid-cols-2 gap-2 mt-4">
                  {book.total_pages && <div className="bg-bg rounded-xl py-2 text-center text-body-sm text-text">{book.total_pages} páginas</div>}
                  {book.language && <div className="bg-bg rounded-xl py-2 text-center text-body-sm text-text">{book.language}</div>}
                  {book.format && <div className="bg-bg rounded-xl py-2 text-center text-body-sm text-text">{formatOptions.find((f) => f.value === book.format)?.label}</div>}
                  {book.category && <div className="bg-bg rounded-xl py-2 text-center text-body-sm text-text">{book.category}</div>}
                </div>

                {book.status === 'abandonado' && book.abandon_reason && (
                  <div className="mt-4">
                    <p className="text-body-sm text-text-secondary mb-1">Motivo de abandono</p>
                    <div className="bg-bg rounded-xl p-3 text-body-md text-text">{book.abandon_reason}</div>
                  </div>
                )}

                {book.status === 'terminado' && (
                  <Button variant={hasReview ? 'primary' : 'green'} className="mt-5" onClick={() => setIsResenaOpen(true)}>
                    {hasReview ? 'Ver Reseña de Lectura' : 'Crear Reseña de Lectura'}
                  </Button>
                )}
                {book.status === 'abandonado' && (
                  <Button variant="green" className="mt-5" onClick={() => updateBook({ status: 'leyendo' })}>
                    Retomar Lectura
                  </Button>
                )}

                <div className="flex gap-3 mt-3">
                  <Button variant="outline" onClick={() => setDeleteState('confirm')}>Eliminar Libro</Button>
                  <Button variant="amber" onClick={startEditing}>Editar Libro</Button>
                </div>
              </>
            ) : draft ? (
              <>
                <label className="text-body-sm text-text-secondary block mb-1 mt-2">Título</label>
                <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />

                <label className="text-body-sm text-text-secondary block mb-1 mt-4">Autor</label>
                <Input value={draft.author} onChange={(e) => setDraft({ ...draft, author: e.target.value })} />

                <label className="text-body-sm text-text-secondary block mb-1 mt-4">Formato</label>
<SegmentedTabs options={formatOptions} active={draft.format} onChange={(format) => setDraft({ ...draft, format })} />

{draft.format !== 'digital' ? (
  <div className="grid grid-cols-2 gap-3 mt-4">
    <div>
      {draft.format === 'audiolibro' ? (
        <>
          <label className="text-body-sm text-text-secondary block mb-1">Duración</label>
          <DurationMaskInput value={draft.totalDuration} onChange={(v) => setDraft({ ...draft, totalDuration: v })} />
        </>
      ) : (
        <>
          <label className="text-body-sm text-text-secondary block mb-1">Páginas</label>
          <Input type="number" placeholder="000" value={draft.totalPages} onChange={(e) => setDraft({ ...draft, totalPages: e.target.value })} />
        </>
      )}
    </div>
    <div>
      <label className="text-body-sm text-text-secondary block mb-1">Idioma</label>
      <Input placeholder="Español" value={draft.language} onChange={(e) => setDraft({ ...draft, language: e.target.value })} />
    </div>
  </div>
) : (
  <>
    <label className="text-body-sm text-text-secondary block mb-1 mt-4">Idioma</label>
    <Input placeholder="Español" value={draft.language} onChange={(e) => setDraft({ ...draft, language: e.target.value })} />
  </>
)}

<div className="grid grid-cols-2 gap-3 mt-4">
                  <div>
                    <label className="text-body-sm text-text-secondary block mb-1">Categoría</label>
                    <Select options={categoryOptions} value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-body-sm text-text-secondary block mb-1">Estado</label>
                    <Select options={statusOptions} value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as ReadingStatus })} />
                  </div>
                </div>

                <label className="text-body-sm text-text-secondary block mb-1 mt-4">Etiquetas</label>
                <div className="bg-border rounded-2xl p-3">
                  <HorizontalScroller>
                    {tags.map((tag) => <Tag key={tag} label={tag} onRemove={() => removeTag(tag)} />)}
                  </HorizontalScroller>
                </div>
                <div className="mt-2"><TagInput onAdd={addTag} /></div>

                <label className="text-body-sm text-text-secondary block mb-1 mt-4">Marcar como favorito</label>
                <FavoriteToggle isFavorite={book.is_favorite ?? false} onToggle={() => updateBook({ is_favorite: !book.is_favorite })} />

                <div className="flex gap-3 mt-5">
                  <Button variant="outline" onClick={() => setIsEditing(false)}>Cancelar</Button>
                  <Button variant="green" onClick={handleSave}>Guardar Cambios</Button>
                </div>
              </>
            ) : null}
          </>
        )}
      </div>

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

      {isResenaOpen && (
        <Resena
          bookId={bookId}
          onClose={() => {
            setIsResenaOpen(false)
            refetchReview()
          }}
        />
      )}
    </div>
  )
}