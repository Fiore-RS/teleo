import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Check, ImageOff } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { Sheet } from '../atoms/Sheet'
import { Button } from '../atoms/Button'
import { CoverImage } from '../atoms/CoverImage'
import { ProgressBar } from '../atoms/ProgressBar'
import { FormActions } from './FormLayout'
import { supabase } from '../../../lib/supabase'
import { fetchAllRows } from '../../../lib/fetchAllRows'
import { findSubjectsForBook } from '../../../lib/bookSearch'
import { suggestGenres } from '../../../lib/genreSuggest'
import { genreLabel, type GenreKey } from '../../../lib/bookTraits'

interface ShelfBook {
  id: string
  title: string
  author: string | null
  isbn: string | null
  category: string | null
  cover_url: string | null
  genres: string[]
}

/** Avance guardado en el dispositivo, para seguir donde quedó si se cierra la app. */
interface Progress {
  /** Libros ya buscados (con o sin sugerencia). */
  checked: string[]
  /** Sugerencias encontradas que todavía no se guardaron. */
  found: Record<string, GenreKey[]>
}

const EMPTY_PROGRESS: Progress = { checked: [], found: {} }
/** Pausa entre libros, para no chocar con los límites de las fuentes. */
const PAUSE_MS = 700
/** Fallas seguidas (ninguna fuente respondió) antes de detenerse. */
const MAX_FAILURES = 3

const storageKey = (userId: string) => `teleo:genreSuggest:${userId}`

function loadProgress(userId: string): Progress {
  try {
    const raw = localStorage.getItem(storageKey(userId))
    if (!raw) return EMPTY_PROGRESS
    const parsed = JSON.parse(raw) as Partial<Progress>
    return { checked: parsed.checked ?? [], found: parsed.found ?? {} }
  } catch {
    return EMPTY_PROGRESS
  }
}

function saveProgress(userId: string, progress: Progress) {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(progress))
  } catch {
    // Sin almacenamiento el avance no se guarda; se puede volver a empezar.
  }
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

type Phase = 'loading' | 'intro' | 'running' | 'stopped' | 'review' | 'saved'

interface GenreSuggestSheetProps {
  userId: string | undefined
  onClose: () => void
}

/** "Completar géneros" (V.3.1.0): busca de a uno los libros sin género en Open Library,
 *  AniList y Google Books, propone géneros y al final se revisan antes de guardarlos. Nunca
 *  toca un libro que ya tiene género. El avance se guarda en el dispositivo. */
export function GenreSuggestSheet({ userId, onClose }: GenreSuggestSheetProps) {
  const queryClient = useQueryClient()
  const [phase, setPhase] = useState<Phase>('loading')
  const [books, setBooks] = useState<ShelfBook[]>([])
  const [progress, setProgress] = useState<Progress>(() => (userId ? loadProgress(userId) : EMPTY_PROGRESS))
  const [currentTitle, setCurrentTitle] = useState('')
  const [sourcesDown, setSourcesDown] = useState(false)
  // Géneros que la persona quitó en la revisión, como "idLibro:genero".
  const [removed, setRemoved] = useState<Set<string>>(new Set())
  const [isSaving, setIsSaving] = useState(false)
  const [savedCount, setSavedCount] = useState(0)
  const stopRef = useRef(false)

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    fetchAllRows((from, to) =>
      supabase.from('books').select('id, title, author, isbn, category, cover_url, genres').eq('user_id', userId).order('id').range(from, to)
    )
      .then((rows) => {
        if (cancelled) return
        setBooks(rows)
        setPhase('intro')
      })
      .catch(() => !cancelled && setPhase('intro'))
    return () => {
      cancelled = true
      stopRef.current = true
    }
  }, [userId])

  const withoutGenre = useMemo(() => books.filter((b) => b.genres.length === 0), [books])
  const checkedSet = useMemo(() => new Set(progress.checked), [progress.checked])
  const pending = withoutGenre.filter((b) => !checkedSet.has(b.id))
  const reviewBooks = withoutGenre.filter((b) => (progress.found[b.id]?.length ?? 0) > 0)
  const doneCount = withoutGenre.length - pending.length

  function updateProgress(next: Progress) {
    setProgress(next)
    if (userId) saveProgress(userId, next)
  }

  async function run() {
    if (!userId) return
    stopRef.current = false
    setSourcesDown(false)
    setPhase('running')
    let current = progress
    let failures = 0
    for (const book of pending) {
      if (stopRef.current) return
      setCurrentTitle(book.title)
      const { subjects, failed } = await findSubjectsForBook(book, (found) => suggestGenres(found).length > 0)
      if (stopRef.current) return
      if (failed) {
        failures++
        if (failures >= MAX_FAILURES) {
          setSourcesDown(true)
          setPhase('stopped')
          return
        }
      } else {
        failures = 0
        const genres = suggestGenres(subjects)
        current = {
          checked: [...current.checked, book.id],
          found: genres.length > 0 ? { ...current.found, [book.id]: genres } : current.found,
        }
        updateProgress(current)
      }
      await wait(PAUSE_MS)
    }
    setPhase('review')
  }

  function pause() {
    stopRef.current = true
    setPhase('stopped')
  }

  /** Vuelve a buscar los que no tuvieron sugerencia (por si las fuentes cambiaron). */
  function retryWithoutSuggestion() {
    updateProgress({ checked: progress.checked.filter((id) => (progress.found[id]?.length ?? 0) > 0), found: progress.found })
  }

  function toggleGenre(bookId: string, genre: GenreKey) {
    const key = `${bookId}:${genre}`
    setRemoved((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const accepted = reviewBooks
    .map((b) => ({ id: b.id, genres: (progress.found[b.id] ?? []).filter((g) => !removed.has(`${b.id}:${g}`)) }))
    .filter((b) => b.genres.length > 0)

  async function saveAll() {
    setIsSaving(true)
    for (let i = 0; i < accepted.length; i += 10) {
      await Promise.all(
        accepted.slice(i, i + 10).map((b) =>
          // Solo si sigue sin género: nunca se pisa uno puesto a mano mientras tanto.
          supabase.from('books').update({ genres: b.genres, genres_source: 'suggested' }).eq('id', b.id).filter('genres', 'eq', '{}')
        )
      )
    }
    const savedIds = new Set(reviewBooks.map((b) => b.id))
    const found = Object.fromEntries(Object.entries(progress.found).filter(([id]) => !savedIds.has(id)))
    updateProgress({ checked: progress.checked, found })
    setBooks((prev) => prev.map((b) => {
      const saved = accepted.find((a) => a.id === b.id)
      return saved ? { ...b, genres: saved.genres } : b
    }))
    setSavedCount(accepted.length)
    setRemoved(new Set())
    setIsSaving(false)
    setPhase('saved')
    void queryClient.invalidateQueries()
  }

  function handleClose() {
    stopRef.current = true
    onClose()
  }

  let body: ReactNode
  let footer: ReactNode = null

  if (phase === 'loading') {
    body = <p className="text-body-md text-text-secondary">Revisando tu estante...</p>
  } else if (phase === 'intro' || phase === 'stopped') {
    const started = doneCount > 0
    body = (
      <div className="animate-fade-in">
        {sourcesDown && (
          <p className="text-body-md text-primary-text mb-3.5">
            Las fuentes de libros no responden ahora. Tu avance quedó guardado; inténtalo de nuevo más tarde.
          </p>
        )}
        {withoutGenre.length === 0 ? (
          <p className="text-body-md text-text-secondary">Todos tus libros ya tienen género.</p>
        ) : (
          <>
            <p className="text-body-md text-text-secondary mb-3.5">
              {withoutGenre.length === 1 ? 'Tienes 1 libro sin género.' : `Tienes ${withoutGenre.length} libros sin género.`} Teleo
              los busca uno por uno en Open Library, AniList y Google Books y te propone hasta 3 géneros para cada uno.
              Antes de guardar puedes revisarlos. Nunca cambia un género que pusiste tú.
            </p>
            {started && (
              <div className="mb-3.5">
                <ProgressBar percent={(doneCount / withoutGenre.length) * 100} />
                <p className="text-body-sm text-text-muted mt-1.5 tabular-nums">
                  {doneCount} de {withoutGenre.length} revisados · {reviewBooks.length} con sugerencia
                </p>
              </div>
            )}
            {pending.length > 0 ? (
              <p className="text-body-sm text-text-muted">Va de a poco para no saturar las fuentes. Puedes cerrar y seguir otro día.</p>
            ) : (
              doneCount > reviewBooks.length && (
                <button type="button" onClick={retryWithoutSuggestion} className="text-body-sm font-bold text-primary-text">
                  Volver a buscar los {doneCount - reviewBooks.length} sin sugerencia
                </button>
              )
            )}
          </>
        )}
      </div>
    )
    footer = withoutGenre.length > 0 && (
      <FormActions>
        {reviewBooks.length > 0 && (
          <Button variant="soft" onClick={() => setPhase('review')}>Revisar ({reviewBooks.length})</Button>
        )}
        {pending.length > 0 ? (
          <Button variant="primary" onClick={run}>{started ? 'Seguir' : 'Empezar'}</Button>
        ) : (
          reviewBooks.length === 0 && <Button variant="primary" onClick={handleClose}>Listo</Button>
        )}
      </FormActions>
    )
  } else if (phase === 'running') {
    body = (
      <div className="animate-fade-in">
        <ProgressBar percent={withoutGenre.length > 0 ? (doneCount / withoutGenre.length) * 100 : 0} />
        <p className="text-body-sm text-text-muted mt-1.5 tabular-nums">
          {doneCount} de {withoutGenre.length} revisados · {reviewBooks.length} con sugerencia
        </p>
        <p className="text-body-md text-text-secondary mt-3.5 truncate">Buscando {currentTitle}</p>
      </div>
    )
    footer = (
      <FormActions>
        <Button variant="outline" onClick={pause}>Pausar</Button>
      </FormActions>
    )
  } else if (phase === 'review') {
    body = (
      <div className="animate-fade-in">
        <p className="text-body-md text-text-secondary mb-3.5">
          Toca un género para quitarlo. Se guardan solo los libros con al menos uno.
        </p>
        {reviewBooks.length === 0 ? (
          <p className="text-body-md text-text-secondary">No se encontraron sugerencias.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {reviewBooks.map((b) => (
              <li key={b.id} className="flex gap-3 py-3 first:pt-0">
                <div className="w-10 shrink-0 aspect-2/3 rounded-[6px] overflow-hidden bg-surface-2">
                  {b.cover_url ? (
                    <CoverImage src={b.cover_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><ImageOff size={12} className="text-text-secondary" /></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-semibold text-body-md leading-tight text-text line-clamp-2">{b.title}</p>
                  {b.author && <p className="text-body-sm text-text-secondary truncate">{b.author}</p>}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {(progress.found[b.id] ?? []).map((g) => {
                      const on = !removed.has(`${b.id}:${g}`)
                      return (
                        <button
                          key={g}
                          type="button"
                          role="checkbox"
                          aria-checked={on}
                          onClick={() => toggleGenre(b.id, g)}
                          className={`inline-flex items-center gap-1 rounded-full border-[1.5px] px-2.5 py-1 font-body font-semibold text-body-sm ${
                            on ? 'border-primary-text bg-primary-soft text-primary-text' : 'border-border bg-surface-2 text-text-muted line-through'
                          }`}
                        >
                          {on && <Check size={12} strokeWidth={3} aria-hidden="true" />}
                          {genreLabel(g)}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    )
    footer = (
      <FormActions>
        <Button variant="outline" onClick={() => setPhase('intro')} disabled={isSaving}>Volver</Button>
        <Button variant="primary" onClick={saveAll} isLoading={isSaving} disabled={accepted.length === 0}>
          {accepted.length === 1 ? 'Guardar 1 libro' : `Guardar ${accepted.length} libros`}
        </Button>
      </FormActions>
    )
  } else {
    body = (
      <p className="text-body-md text-text-secondary animate-fade-in">
        {savedCount === 1 ? 'Listo: 1 libro ya tiene género.' : `Listo: ${savedCount} libros ya tienen género.`}{' '}
        {pending.length > 0 ? `Quedan ${pending.length} por revisar.` : ''}
      </p>
    )
    footer = (
      <FormActions>
        {pending.length > 0 && <Button variant="soft" onClick={run}>Seguir</Button>}
        <Button variant="primary" onClick={handleClose}>Listo</Button>
      </FormActions>
    )
  }

  return (
    <Sheet onClose={handleClose} title={phase === 'review' ? 'Revisar géneros' : 'Completar géneros'} footer={footer || undefined}>
      {body}
    </Sheet>
  )
}
