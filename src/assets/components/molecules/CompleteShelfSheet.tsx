import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { ImageOff } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { Sheet } from '../atoms/Sheet'
import { Button } from '../atoms/Button'
import { CoverImage } from '../atoms/CoverImage'
import { FormActions } from './FormLayout'
import { BookTraitsFields } from './BookTraitsFields'
import { supabase } from '../../../lib/supabase'
import { fetchAllRows } from '../../../lib/fetchAllRows'
import { useUserCustomMoods } from '../../../hooks/useUserCustomMoods'
import { useUiMarks } from '../../../hooks/useUiMarks'
import { traitsFromBook, traitsToColumns, type BookTraits } from '../../../lib/bookTraits'

interface ShelfBook {
  id: string
  title: string
  author: string | null
  cover_url: string | null
  status: string
  end_date: string | null
  genres: string[]
  moods: string[]
  custom_moods: string[]
  pace: string | null
}

/** Estados que entran: solo quien leyó (o empezó) el libro sabe su ánimo y ritmo. Los
 *  terminados primero, del más reciente al más antiguo. */
const STATUS_ORDER = ['terminado', 'abandonado', 'pausado', 'leyendo']

function isMissingSomething(book: ShelfBook): boolean {
  const t = traitsFromBook(book)
  return t.genres.length === 0 || t.moods.length + t.customMoods.length === 0 || t.pace === null
}

interface CompleteShelfSheetProps {
  userId: string | undefined
  onClose: () => void
}

/** "Completa tu estante" (V.3.1.0): un libro por pantalla para poner género, ánimo y ritmo a
 *  los libros que ya leíste o empezaste. "Saltar" lo deja para después (se recuerda en la
 *  cuenta desde la V.3.7.2, ui_marks.completeShelfSkipped); se puede cerrar en cualquier
 *  momento y seguir otro día. */
export function CompleteShelfSheet({ userId, onClose }: CompleteShelfSheetProps) {
  const queryClient = useQueryClient()
  const knownCustomMoods = useUserCustomMoods(userId)
  const [books, setBooks] = useState<ShelfBook[] | null>(null)
  const { marks, patchMarks } = useUiMarks()
  // Copia local mientras la hoja está abierta; cada cambio se guarda también en la cuenta.
  const [skipped, setSkipped] = useState<string[]>(() => marks.completeShelfSkipped ?? [])
  const [doneIds, setDoneIds] = useState<string[]>([])
  const [draft, setDraft] = useState<BookTraits | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    fetchAllRows((from, to) =>
      supabase
        .from('books')
        .select('id, title, author, cover_url, status, end_date, genres, moods, custom_moods, pace')
        .eq('user_id', userId)
        .in('status', STATUS_ORDER)
        .order('id')
        .range(from, to)
    )
      .then((rows) => !cancelled && setBooks(rows))
      .catch(() => !cancelled && setBooks([]))
    return () => {
      cancelled = true
    }
  }, [userId])

  const queue = useMemo(() => {
    if (!books) return []
    return books
      .filter((b) => isMissingSomething(b) && !doneIds.includes(b.id) && !skipped.includes(b.id))
      .sort((a, b) =>
        STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status) || (b.end_date ?? '').localeCompare(a.end_date ?? '')
      )
  }, [books, doneIds, skipped])

  const current = queue[0] ?? null
  // El borrador sigue al libro de turno (se ajusta durante el render, sin efecto).
  const [draftFor, setDraftFor] = useState<string | null>(null)
  if (current && draftFor !== current.id) {
    setDraftFor(current.id)
    setDraft(traitsFromBook(current))
  }

  function skip() {
    if (!current) return
    const next = [...skipped, current.id]
    setSkipped(next)
    void patchMarks({ completeShelfSkipped: next })
  }

  async function saveAndNext() {
    if (!current || !draft) return
    const before = traitsFromBook(current)
    const changed = JSON.stringify(before) !== JSON.stringify(draft)
    if (changed) {
      setIsSaving(true)
      await supabase.from('books').update(traitsToColumns(draft, before)).eq('id', current.id)
      setIsSaving(false)
    }
    setDoneIds((prev) => [...prev, current.id])
  }

  function restoreSkipped() {
    setSkipped([])
    void patchMarks({ completeShelfSkipped: [] })
  }

  function handleClose() {
    if (doneIds.length > 0) {
      void queryClient.invalidateQueries()
    }
    onClose()
  }

  let body: ReactNode
  let footer: ReactNode = null

  if (books === null) {
    body = <p className="text-body-md text-text-secondary">Revisando tu estante...</p>
  } else if (!current || !draft) {
    body = (
      <div className="animate-fade-in">
        <p className="text-body-md text-text-secondary">
          {doneIds.length > 0
            ? `Listo: completaste ${doneIds.length === 1 ? '1 libro' : `${doneIds.length} libros`}.`
            : 'No hay libros leídos por completar.'}
        </p>
        {skipped.length > 0 && (
          <button type="button" onClick={restoreSkipped} className="mt-3 text-body-sm font-bold text-primary-text">
            Volver a ver los {skipped.length} que saltaste
          </button>
        )}
      </div>
    )
    footer = (
      <FormActions>
        <Button variant="primary" onClick={handleClose}>Listo</Button>
      </FormActions>
    )
  } else {
    body = (
      <div key={current.id} className="animate-fade-in">
        <p className="text-body-sm text-text-muted mb-3 tabular-nums">
          {queue.length === 1 ? 'Falta 1 libro' : `Faltan ${queue.length} libros`}
        </p>
        <div className="flex gap-3.5 items-end mb-5.5">
          <div className="w-20 shrink-0 aspect-2/3 rounded-xl overflow-hidden bg-surface-2 shadow-[0_10px_24px_-12px_rgba(60,30,10,0.55)]">
            {current.cover_url ? (
              <CoverImage src={current.cover_url} alt={current.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center"><ImageOff size={20} className="text-text-secondary" /></div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display font-semibold text-[19px] leading-tight text-text line-clamp-3">{current.title}</p>
            {current.author && <p className="text-body-md text-text-secondary mt-1 truncate">{current.author}</p>}
          </div>
        </div>
        <BookTraitsFields value={draft} onChange={setDraft} knownCustomMoods={knownCustomMoods} className="mb-1" />
      </div>
    )
    footer = (
      <FormActions>
        <Button variant="outline" onClick={skip} disabled={isSaving}>Saltar</Button>
        <Button variant="primary" onClick={saveAndNext} isLoading={isSaving}>Siguiente</Button>
      </FormActions>
    )
  }

  return (
    <Sheet onClose={handleClose} title="Completa tu estante" footer={footer || undefined}>
      {body}
    </Sheet>
  )
}
