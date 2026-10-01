import { useState } from 'react'
import { Heart, RefreshCw } from 'lucide-react'
import { Sheet } from '../atoms/Sheet'
import { Input } from '../atoms/Input'
import { Select } from '../atoms/Select'
import { Button } from '../atoms/Button'
import { FormActions, FormCard, FormRow, FormSection, FormSwitchRow } from './FormLayout'
import { supabase } from '../../../lib/supabase'
import { categoryOptions } from '../../../lib/options'

interface AddSagaModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string | undefined
  /** Sagas ya existentes del usuario — se usan solo para calcular el próximo
   *  estante_sort_order (igual que se hace en useLibraryBooks.addBook), así la saga
   *  nueva puede reordenarse en Estante desde el primer momento en vez de quedar con
   *  estante_sort_order null. */
  existingSagas: { estante_sort_order: number | null }[]
  onAdded: (newSagaId: string) => void
}

/** Agregar saga (V.2.2.0): misma forma que Editar saga. El estado no se elige: se calcula
 *  con los libros que se le agreguen (lib/sagaStatus.ts); sin libros queda Pendiente. */
export function AddSagaModal({ isOpen, onClose, userId, existingSagas, onAdded }: AddSagaModalProps) {
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [category, setCategory] = useState('Novela')
  const [totalBooks, setTotalBooks] = useState('')
  const [isFavorite, setIsFavorite] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  function reset() {
    setTitle('')
    setAuthor('')
    setCategory('Novela')
    setTotalBooks('')
    setIsFavorite(false)
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function handleCreate() {
    if (!userId || !title.trim()) return
    setIsSaving(true)
    const maxOrder = existingSagas.length > 0
      ? Math.max(...existingSagas.map((s) => s.estante_sort_order ?? 0))
      : 0
    const total = Number.parseInt(totalBooks, 10)
    const { data, error } = await supabase
      .from('sagas')
      .insert({
        user_id: userId,
        title: title.trim(),
        author: author.trim() || null,
        category,
        status: 'pendiente',
        total_books: total > 0 ? total : null,
        is_favorite: isFavorite,
        estante_sort_order: maxOrder + 1000,
      })
      .select('id')
      .single()

    setIsSaving(false)
    if (!error && data) {
      onAdded(data.id)
      handleClose()
    }
  }

  if (!isOpen) return null

  return (
    <Sheet
      onClose={handleClose}
      title="Agregar saga"
      footer={
        <FormActions>
          <Button variant="outline" onClick={handleClose}>Cancelar</Button>
          <Button variant="primary" onClick={handleCreate} isLoading={isSaving} disabled={!title.trim()}>
            Crear saga
          </Button>
        </FormActions>
      }
    >
      <div className="animate-fade-in">
        <div className="flex gap-3.5 items-end mb-5.5">
          <div className="relative flex aspect-4/5 w-23 shrink-0" aria-hidden="true">
            <div className="w-4.5 h-[92%] mt-[8%] rounded-l-md bg-primary" />
            <div className="w-5 h-[96%] mt-[4%] rounded-l-md bg-orange -ml-1" />
            <div className="flex-1 h-full rounded-[10px] bg-magenta -ml-2" />
          </div>
          <div className="flex-1 min-w-0 flex flex-col gap-2">
            <Input
              bare
              aria-label="Título"
              placeholder="Título de la saga"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border-b-[1.5px] border-border focus:border-primary-text py-1 font-display font-semibold text-[20px] leading-tight"
            />
            <Input
              bare
              aria-label="Autor"
              placeholder="Autor"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="border-b-[1.5px] border-border focus:border-primary-text py-1 text-body-lg text-text-secondary"
            />
            <span className="inline-flex items-center gap-1 mt-1 text-body-sm text-text-muted">
              <RefreshCw size={12} strokeWidth={2.2} aria-hidden="true" />
              El estado se calcula con sus libros
            </span>
          </div>
        </div>

        <FormSection label="La saga" className="mb-1">
          <FormCard>
            <FormRow label="Categoría">
              <Select bare options={categoryOptions} value={category} onChange={(e) => setCategory(e.target.value)} />
            </FormRow>
            <div>
              <FormRow label="Libros en total" optional htmlFor="new-saga-total" className="pb-1">
                <Input
                  bare
                  id="new-saga-total"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  placeholder="?"
                  value={totalBooks}
                  onChange={(e) => setTotalBooks(e.target.value)}
                  className="w-11! text-center text-body-lg tabular-nums border-b-[1.5px] border-border focus:border-primary-text"
                />
              </FormRow>
              <p className="px-3.5 pb-2.5 text-body-sm text-text-muted">Déjalo vacío si todavía no sabes cuántos tendrá.</p>
            </div>
            <FormSwitchRow icon={Heart} label="Favorita" checked={isFavorite} onChange={setIsFavorite} />
          </FormCard>
        </FormSection>
      </div>
    </Sheet>
  )
}
