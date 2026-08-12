import { useState } from 'react'
import { Modal } from '../atoms/Modal'
import { Input } from '../atoms/Input'
import { Select } from '../atoms/Select'
import { FavoriteToggle } from '../atoms/FavoriteToggle'
import { Button } from '../atoms/Button'
import { supabase } from '../../../lib/supabase'
import { statusLabel, type ReadingStatus } from '../../../lib/status'

const categoryOptions = [
  { value: 'Novela', label: 'Novela' },
  { value: 'Ensayo', label: 'Ensayo' },
  { value: 'Poesía', label: 'Poesía' },
  { value: 'Cómic/Manga', label: 'Cómic/Manga' },
  { value: 'No ficción', label: 'No ficción' },
]

const statusOptions = (Object.keys(statusLabel) as ReadingStatus[]).map((value) => ({
  value, label: statusLabel[value],
}))

interface AddSagaModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string | undefined
  onAdded: (newSagaId: string) => void
}

export function AddSagaModal({ isOpen, onClose, userId, onAdded }: AddSagaModalProps) {
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [category, setCategory] = useState('Novela')
  const [status, setStatus] = useState<ReadingStatus>('pendiente')
  const [isFavorite, setIsFavorite] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  function reset() {
    setTitle('')
    setAuthor('')
    setCategory('Novela')
    setStatus('pendiente')
    setIsFavorite(false)
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function handleCreate() {
    if (!userId || !title.trim()) return
    setIsSaving(true)
    const { data, error } = await supabase
      .from('sagas')
      .insert({
        user_id: userId,
        title: title.trim(),
        author: author.trim() || null,
        category,
        status,
        is_favorite: isFavorite,
      })
      .select('id')
      .single()

    setIsSaving(false)
    if (!error && data) {
      onAdded(data.id)
      handleClose()
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Nueva saga para el estante">
      <div className="relative flex aspect-4/5 w-32 mx-auto my-4 drop-shadow-md">
        <div className="w-5 h-[92%] mt-[8%] rounded-t-md rounded-l-md bg-accent-wishlist" />
        <div className="w-6 h-[96%] mt-[4%] rounded-t-md rounded-l-md bg-accent-reading -ml-1" />
        <div className="flex-1 h-full rounded-xl bg-accent-finished -ml-2" />
      </div>

      <label className="text-body-sm text-text-secondary block mb-1">Título</label>
      <Input placeholder="Título de la saga" value={title} onChange={(e) => setTitle(e.target.value)} />

      <label className="text-body-sm text-text-secondary block mb-1 mt-4">Autor</label>
      <Input placeholder="Autor de la saga" value={author} onChange={(e) => setAuthor(e.target.value)} />

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div>
          <label className="text-body-sm text-text-secondary block mb-1">Categoría</label>
          <Select options={categoryOptions} value={category} onChange={(e) => setCategory(e.target.value)} />
        </div>
        <div>
          <label className="text-body-sm text-text-secondary block mb-1">Estado</label>
          <Select
            options={statusOptions}
            value={status}
            onChange={(e) => setStatus(e.target.value as ReadingStatus)}
          />
        </div>
      </div>

      <label className="text-body-sm text-text-secondary block mb-1 mt-4">Marcar como favorito</label>
      <FavoriteToggle isFavorite={isFavorite} onToggle={() => setIsFavorite((prev) => !prev)} />

      <Button
        variant="primary"
        className="mt-5"
        onClick={handleCreate}
        isLoading={isSaving}
        disabled={!title.trim()}
      >
        Crear Saga
      </Button>
    </Modal>
  )
}